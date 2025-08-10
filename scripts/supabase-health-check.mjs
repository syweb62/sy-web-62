import process from "node:process"

// Minimal Supabase REST health check using fetch (no extra deps).
// This does NOT mutate any data. It only reads public info to verify connectivity.
// Output is printed with console.log so v0 captures results.

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function red(s) { return `\x1b[31m${s}\x1b[0m` }
function green(s) { return `\x1b[32m${s}\x1b[0m` }
function yellow(s) { return `\x1b[33m${s}\x1b[0m` }
function gray(s) { return `\x1b[90m${s}\x1b[0m` }

async function getJSON(endpoint, withAuth = true) {
  const headers = { "Content-Type": "application/json" }
  if (withAuth && anon) {
    headers["apikey"] = anon
    headers["Authorization"] = `Bearer ${anon}`
    headers["Prefer"] = "return=representation"
  }
  const res = await fetch(endpoint, { headers })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, headers: res.headers, data: json }
}

async function check() {
  console.log(gray("=== Supabase Health Check ==="))
  console.log("URL:", url ? green(url) : red("Missing"))
  console.log("Anon Key:", anon ? green("Present") : red("Missing"))

  if (!url || !anon) {
    console.log(red("Environment variables are not fully set."))
    console.log("Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)")
    process.exit(1)
  }

  // 1) Auth settings endpoint
  try {
    const { ok, status } = await getJSON(`${url}/auth/v1/settings`, true)
    console.log("Auth settings:", ok ? green(`OK (${status})`) : red(`Failed (${status})`))
    if (!ok) throw new Error("Auth endpoint not reachable with provided key.")
  } catch (e) {
    console.error(red("Auth check failed:"), e?.message || e)
    process.exit(1)
  }

  // 2) REST connectivity to tables (read-only)
  const tables = ["profiles", "menu_items", "orders", "order_items", "reservations", "social_media_links"]
  for (const t of tables) {
    try {
      const endpoint = `${url}/rest/v1/${t}?select=id&limit=1`
      const { ok, status, headers } = await getJSON(endpoint, true)
      if (ok || status === 206 || status === 200) {
        const contentRange = headers.get("content-range") || headers.get("Content-Range")
        const countHint = contentRange ? contentRange.split("/")[1] : "unknown"
        console.log(`Table ${t}:`, green(`reachable (count≈${countHint})`))
      } else {
        console.log(`Table ${t}:`, yellow(`reachable=${ok} status=${status}`))
      }
    } catch (e) {
      console.log(`Table ${t}:`, red(`error: ${e?.message || e}`))
    }
  }

  // 3) Verify RLS behavior for public read (menu_items should be readable)
  try {
    const { ok, status } = await getJSON(`${url}/rest/v1/menu_items?select=id,name&limit=1`, true)
    console.log("RLS public read (menu_items):", ok ? green(`OK (${status})`) : red(`Failed (${status})`))
  } catch (e) {
    console.log("RLS public read (menu_items):", red(`error: ${e?.message || e}`))
  }

  console.log(gray("=== Health Check Complete ==="))
}

check().catch((err) => {
  console.error(red("Unexpected error:"), err)
  process.exit(1)
})
