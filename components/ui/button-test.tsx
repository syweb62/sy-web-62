"use client"

import * as React from "react"
import { Button } from "./button"
import { ButtonGroup } from "./button-group"
import { IconButton } from "./icon-button"
import { FloatingActionButton } from "./floating-action-button"
import { Download, Upload, Save, Edit, Trash2, Plus, Settings, Heart, Share, Star } from "lucide-react"

export function ButtonTest() {
  const [loading, setLoading] = React.useState(false)
  const [liked, setLiked] = React.useState(false)

  const handleAsyncAction = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Button Component Test Suite</h1>

        {/* Variants */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="info">Info</Button>
          </div>
        </section>

        {/* Sizes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </section>

        {/* States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Button States</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button loading={loading} loadingText="Processing..." onClick={handleAsyncAction}>
              Async Action
            </Button>
          </div>
        </section>

        {/* With Icons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Buttons with Icons</h2>
          <div className="flex flex-wrap gap-4">
            <Button leftIcon={<Download size={16} />}>Download</Button>
            <Button rightIcon={<Upload size={16} />}>Upload</Button>
            <Button leftIcon={<Save size={16} />} rightIcon={<Edit size={16} />}>
              Save & Edit
            </Button>
          </div>
        </section>

        {/* Icon Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Icon Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <IconButton icon={<Settings size={16} />} label="Settings" />
            <IconButton
              icon={<Heart size={16} />}
              label="Like"
              variant={liked ? "destructive" : "outline"}
              onClick={() => setLiked(!liked)}
            />
            <IconButton icon={<Share size={16} />} label="Share" variant="ghost" />
            <IconButton icon={<Star size={16} />} label="Favorite" size="icon-sm" />
            <IconButton icon={<Plus size={20} />} label="Add" size="icon-lg" />
          </div>
        </section>

        {/* Button Groups */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Button Groups</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Horizontal Group</h3>
              <ButtonGroup>
                <Button>First</Button>
                <Button>Second</Button>
                <Button>Third</Button>
              </ButtonGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Vertical Group</h3>
              <ButtonGroup orientation="vertical">
                <Button>Top</Button>
                <Button>Middle</Button>
                <Button>Bottom</Button>
              </ButtonGroup>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Full Width Group</h3>
              <ButtonGroup fullWidth>
                <Button>Option A</Button>
                <Button>Option B</Button>
                <Button>Option C</Button>
              </ButtonGroup>
            </div>
          </div>
        </section>

        {/* Full Width Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Full Width Buttons</h2>
          <div className="space-y-2 max-w-md">
            <Button fullWidth>Full Width Default</Button>
            <Button fullWidth variant="outline">
              Full Width Outline
            </Button>
            <Button fullWidth variant="ghost">
              Full Width Ghost
            </Button>
          </div>
        </section>

        {/* Responsive Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Responsive Test</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button fullWidth>Mobile First</Button>
            <Button fullWidth variant="outline">
              Responsive
            </Button>
            <Button fullWidth variant="secondary">
              Design
            </Button>
            <Button fullWidth variant="ghost">
              Testing
            </Button>
          </div>
        </section>

        {/* Accessibility Test */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Accessibility Features</h2>
          <div className="space-y-2">
            <Button aria-describedby="help-text" leftIcon={<Save size={16} />}>
              Save Document
            </Button>
            <p id="help-text" className="text-sm text-gray-400">
              This button saves your current document with proper ARIA labeling
            </p>

            <Button variant="destructive" leftIcon={<Trash2 size={16} />} aria-label="Delete item permanently">
              Delete
            </Button>
          </div>
        </section>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButton icon={<Plus size={24} />} label="Add new item" position="bottom-right" />

      <FloatingActionButton
        icon={<Settings size={20} />}
        label="Settings"
        position="bottom-left"
        variant="secondary"
        size="default"
      />
    </div>
  )
}
