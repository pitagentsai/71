"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface EffectControlsProps {
  halftoneSize: number
  contrast: number
  accentColor: string
  mouseRadius: number
  repulsionStrength: number
  returnSpeed: number
  accentProbability: number
  sizeVariation: number
  onHalftoneSizeChange: (value: number) => void
  onContrastChange: (value: number) => void
  onAccentColorChange: (value: string) => void
  onMouseRadiusChange: (value: number) => void
  onRepulsionStrengthChange: (value: number) => void
  onReturnSpeedChange: (value: number) => void
  onAccentProbabilityChange: (value: number) => void
  onSizeVariationChange: (value: number) => void
}

export function EffectControls({
  halftoneSize,
  contrast,
  accentColor,
  mouseRadius,
  repulsionStrength,
  returnSpeed,
  accentProbability,
  sizeVariation,
  onHalftoneSizeChange,
  onContrastChange,
  onAccentColorChange,
  onMouseRadiusChange,
  onRepulsionStrengthChange,
  onReturnSpeedChange,
  onAccentProbabilityChange,
  onSizeVariationChange,
}: EffectControlsProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/60 font-mono tracking-wider">Adjust parameters and hover over the image to interact</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="halftone-size" className="text-white font-mono text-sm tracking-wider">Halftone Dot Size</Label>
            <span className="text-sm text-white/60 font-mono">{halftoneSize}px</span>
          </div>
          <Slider
            id="halftone-size"
            min={2}
            max={12}
            step={1}
            value={[halftoneSize]}
            onValueChange={([value]) => onHalftoneSizeChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">Controls the size of the halftone dots</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="text-white font-mono text-sm tracking-wider">Contrast</Label>
            <span className="text-sm text-white/60 font-mono">{contrast.toFixed(1)}x</span>
          </div>
          <Slider
            id="contrast"
            min={0.5}
            max={2}
            step={0.1}
            value={[contrast]}
            onValueChange={([value]) => onContrastChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">Adjusts the contrast before applying effects</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="size-variation" className="text-white font-mono text-sm tracking-wider">Size Variation</Label>
            <span className="text-sm text-white/60 font-mono">{(sizeVariation * 100).toFixed(0)}%</span>
          </div>
          <Slider
            id="size-variation"
            min={0}
            max={0.5}
            step={0.05}
            value={[sizeVariation]}
            onValueChange={([value]) => onSizeVariationChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">Makes dots more heterogeneous and organic</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="mouse-radius" className="text-white font-mono text-sm tracking-wider">Mouse Impact Radius</Label>
            <span className="text-sm text-white/60 font-mono">{mouseRadius}px</span>
          </div>
          <Slider
            id="mouse-radius"
            min={50}
            max={300}
            step={10}
            value={[mouseRadius]}
            onValueChange={([value]) => onMouseRadiusChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">Area of influence around the cursor</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="repulsion-strength" className="text-white font-mono text-sm tracking-wider">Repulsion Strength</Label>
            <span className="text-sm text-white/60 font-mono">{repulsionStrength.toFixed(1)}x</span>
          </div>
          <Slider
            id="repulsion-strength"
            min={0.1}
            max={2}
            step={0.1}
            value={[repulsionStrength]}
            onValueChange={([value]) => onRepulsionStrengthChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">How strongly dots are pushed by cursor movement</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="return-speed" className="text-white font-mono text-sm tracking-wider">Return Speed</Label>
            <span className="text-sm text-white/60 font-mono">{(returnSpeed * 100).toFixed(0)}%</span>
          </div>
          <Slider
            id="return-speed"
            min={0.05}
            max={0.3}
            step={0.01}
            value={[returnSpeed]}
            onValueChange={([value]) => onReturnSpeedChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">How quickly dots return to original position</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-color" className="text-white font-mono text-sm tracking-wider">Accent Color</Label>
          <div className="flex gap-2 items-center">
            <input
              id="accent-color"
              type="color"
              value={accentColor}
              onChange={(e) => onAccentColorChange(e.target.value)}
              className="w-12 h-12 rounded border border-white/30 cursor-pointer"
            />
            <span className="text-sm text-white/60 font-mono">{accentColor}</span>
          </div>
          <p className="text-xs text-white/50 font-mono">Random accent dots will use this color</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="accent-probability" className="text-white font-mono text-sm tracking-wider">Accent Probability</Label>
            <span className="text-sm text-white/60 font-mono">{(accentProbability * 100).toFixed(0)}%</span>
          </div>
          <Slider
            id="accent-probability"
            min={0}
            max={0.1}
            step={0.005}
            value={[accentProbability]}
            onValueChange={([value]) => onAccentProbabilityChange(value)}
            className="[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
          />
          <p className="text-xs text-white/50 font-mono">Chance of dots being colored with accent</p>
        </div>
      </div>
    </div>
  )
}
