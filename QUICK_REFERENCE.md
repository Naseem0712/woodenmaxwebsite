# 🚀 QUICK REFERENCE: Perforated Panels Project

## 📍 3 Pages Overview

```
┌─────────────────────────────────────────────────┐
│         PAGE 1: HUB PAGE (Entry Point)          │
│  /products/perforated-panels                     │
├─────────────────────────────────────────────────┤
│ • Hero (2 CTAs: Ceiling | Cladding)             │
│ • Design Preview Grid (4-5 SVGs)                │
│ • How to Use (3 steps)                          │
│ • Application Split (Ceiling vs Cladding)        │
│ • Material Philosophy                           │
│ • Why No Catalog                                │
└─────────────────────────────────────────────────┘
                    ↓                    ↓
    ┌──────────────────────┐  ┌──────────────────────┐
    │ PAGE 2: CEILING      │  │ PAGE 3: CLADDING     │
    │ /ceiling-system      │  │ /cladding-system     │
    ├──────────────────────┤  ├──────────────────────┤
    │ • System Intro       │  │ • System Intro       │
    │ • Design Preview     │  │ • Design Preview     │
    │ • Fabrication        │  │ • Fabrication        │
    │ • Fixing System      │  │ • Wind & Structural  │
    │ • Calculator ⚡      │  │ • Fixing System      │
    │ • Performance        │  │ • Material Compare   │
    │                      │  │ • Decision Summary   │
    └──────────────────────┘  └──────────────────────┘
```

---

## 🎯 Key Features Per Page

### HUB PAGE
- ✅ Decision gateway (Ceiling vs Cladding)
- ✅ Design preview with hover effects
- ✅ Clear 3-step usage guide
- ✅ No catalog confusion

### CEILING PAGE
- ✅ Interior focus
- ✅ Lightweight emphasis
- ✅ Clip-in system details
- ✅ **Thickness Options**: 1.0mm, 1.2mm, 1.5mm
- ✅ **Panel Sizes**: Standard sizes table
- ✅ **Calculator** (Width × Height × Thickness × Qty)

### CLADDING PAGE
- ✅ Exterior focus
- ✅ Wind resistance emphasis
- ✅ **Thickness Options**: 2.0mm, 2.5mm, 3.0mm (Elevation)
- ✅ **Panel Sizes**: Standard sizes for elevation
- ✅ Structural engineering details
- ✅ Thickness selection guide
- ✅ Material comparison table

---

## 📁 File Structure

```
products/perforated-panels/
├── index.html              ← HUB PAGE
├── ceiling-system.html     ← CEILING PAGE
└── cladding-system.html    ← CLADDING PAGE

css/
└── perforated-panels.css   ← New CSS file

js/
├── calculator/extensions/
│   └── perforated-ceiling-calculator.js
└── perforated-panels.js    ← Design preview, interactions

data/
└── products.json           ← Add perforated panel configs

images/products/perforated-panels/
├── designs/               ← SVG patterns (4-5 files)
├── ceiling/               ← Ceiling images
└── cladding/              ← Cladding images
```

---

## 🧮 Calculator Specs

### CEILING Calculator Inputs
- Width (mm/cm/ft/m)
- Height/Length (mm/cm/ft/m)
- **Thickness** (Dropdown): 1.0mm | 1.2mm | 1.5mm
- Quantity

### CEILING Calculator Outputs
- Area (sqft)
- Approx Weight (kg) - varies by thickness
- Indicative Price (₹) - varies by thickness

### CLADDING Calculator (Future Enhancement)
- Width (mm/cm/ft/m)
- Height/Length (mm/cm/ft/m)
- **Thickness** (Dropdown): 2.0mm | 2.5mm | 3.0mm
- Quantity
- Wind Zone (Optional)

### Formula
```
Area = (Width × Height × Quantity) → Convert to sqft
Weight = Area × Thickness × 2.7 g/cm³ (Aluminium density)
Price = Area × Rate per sqft (varies by thickness)
```

### Thickness Pricing
**Ceiling:**
- 1.0mm: Base rate
- 1.2mm: Base + 15-20%
- 1.5mm: Base + 30-40%

**Cladding/Elevation:**
- 2.0mm: Base rate
- 2.5mm: Base + ~18%
- 3.0mm: Base + ~38%

---

## 📐 Thickness & Panel Sizes

### CEILING PANELS
**Thickness Options:**
- 1.0 mm (Standard)
- 1.2 mm (Heavy-duty)
- 1.5 mm (Premium)

**Standard Sizes:**
- Widths: 300mm, 400mm, 500mm, 600mm
- Lengths: 600mm, 900mm, 1200mm, 1500mm, 1800mm, 2400mm
- Custom: Up to 3000mm length

### CLADDING/ELEVATION PANELS
**Thickness Options:**
- 2.0 mm (Standard elevation)
- 2.5 mm (Heavy-duty elevation)
- 3.0 mm (Premium/High-rise elevation)

**Standard Sizes:**
- Widths: 400mm, 500mm, 600mm, 800mm, 1000mm
- Lengths: 1200mm, 1500mm, 1800mm, 2400mm, 3000mm
- Custom: Up to 4000mm length (engineering approval required)

**Thickness Selection Guide:**
- Low-rise (< 3 floors): 2.0mm
- Mid-rise (3-10 floors): 2.5mm
- High-rise (> 10 floors): 3.0mm
- Wind Zone III/IV: 2.5-3.0mm

---

## 🎨 Design Patterns Needed

1. **Geometric** (circles)
2. **Linear** (lines)
3. **Organic** (curves)
4. **Grid** (squares)
5. **Custom** (architectural)

**Format**: SVG files, color-customizable

---

## 🔑 Key Messaging

### For Architects
- Engineering specifications
- Technical data
- Performance metrics

### For Contractors
- Clear fixing instructions
- Practical details
- Installation guidance

### For Customers
- Simple explanations
- Visual aids
- No jargon overload

---

## ✅ Implementation Order

1. **Structure** → Create folders & HTML files
2. **Hub Page** → All 6 sections
3. **Ceiling Page** → All sections + Thickness options + Panel sizes + Calculator
4. **Cladding Page** → All sections + Thickness options (2mm, 2.5mm, 3mm) + Panel sizes + Selection guide
5. **Calculator** → Integration with thickness selector + testing all thickness options
6. **SVG Designs** → Create & optimize
7. **Integration** → Sitemap, URLs, navigation
8. **Testing** → Mobile, browser, SEO, calculator accuracy

---

## 📊 Success Criteria

- ✅ Clear ceiling vs cladding separation
- ✅ No catalog requests
- ✅ Calculator works accurately
- ✅ Mobile responsive
- ✅ SEO optimized
- ✅ Fast loading

---

**Quick Start**: See `PLANNING_PERFORATED_PANELS.md` for full details.

