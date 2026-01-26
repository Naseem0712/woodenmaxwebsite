# 📋 PLANNING DOCUMENT: Perforated Aluminium Panels Website

## 🎯 Project Overview

**Goal**: Create a 3-page website structure for Perforated Aluminium Ceiling & Cladding Panels that:
- ✅ Architect samjhe
- ✅ Contractor confuse na ho  
- ✅ Customer ko catalog ki zarurat hi na pade
- ✅ Website = catalog (no PDF dependency)
- ✅ Engineering-safe language
- ✅ AI & Google friendly

---

## 📁 FILE STRUCTURE PLAN

```
woodenmaxwebsite-main/
├── products/
│   └── perforated-panels/
│       ├── index.html                    # HUB PAGE (Entry + Decision Gateway)
│       ├── ceiling-system.html           # CEILING SYSTEM PAGE
│       └── cladding-system.html          # CLADDING SYSTEM PAGE
├── css/
│   └── perforated-panels.css             # New CSS file for these pages
├── js/
│   ├── calculator/
│   │   └── extensions/
│   │       └── perforated-ceiling-calculator.js  # Ceiling calculator logic
│   └── perforated-panels.js              # Interactive features (design preview, etc.)
├── data/
│   └── products.json                     # Add perforated panel configs
└── images/
    └── products/
        └── perforated-panels/
            ├── designs/                  # SVG design patterns
            ├── ceiling/                  # Ceiling system images
            └── cladding/                 # Cladding system images
```

**URL Structure:**
- Hub: `https://woodenmax.in/products/perforated-panels`
- Ceiling: `https://woodenmax.in/products/perforated-panels/ceiling-system`
- Cladding: `https://woodenmax.in/products/perforated-panels/cladding-system`

---

## 🔷 PAGE-1: HUB PAGE (`perforated-panels/index.html`)

### Purpose
Entry point + Decision gateway. Catalog cover + index + filter ka kaam.

### Section Breakdown

#### 🧱 Section-1: Hero (Above the Fold)
**Content:**
- **Heading**: `Perforated Aluminium Panels for Ceiling & Cladding`
- **Sub-text**: `Design-driven, engineered panel systems for modern ceilings and façades.`
- **CTA Buttons**:
  - 🔘 `Explore Ceiling System` → Links to `/ceiling-system`
  - 🔘 `Explore Cladding System` → Links to `/cladding-system`

**Design Notes:**
- Full-width hero with background image
- Two prominent CTA buttons side-by-side
- Mobile: Stack buttons vertically

---

#### 🎨 Section-2: Design Preview Grid
**Content:**
- 4-5 live SVG design thumbnails
- Hover effect → color change preview
- Click → scroll to system selection section
- Text below: `Same design pattern. Different system performance.`

**Technical Implementation:**
- SVG files stored in `images/products/perforated-panels/designs/`
- JavaScript for hover color changes
- Click handler scrolls to Section-4 (Application Split)

**Design Patterns Needed:**
1. Geometric pattern (circles)
2. Linear pattern (lines)
3. Organic pattern (curves)
4. Grid pattern (squares)
5. Custom pattern (architectural)

---

#### 🧠 Section-3: How to Use This Website (Very Important)
**Content:**
Short 3-step guide:

1. **Select a design**
   - Choose from design preview grid above

2. **Choose application – Ceiling or Cladding**
   - Indoor ceiling → Ceiling System
   - Exterior façade → Cladding System

3. **View system details, performance & indicative pricing**
   - System specifications
   - Performance data
   - Live calculator

**Design Notes:**
- Numbered steps with icons
- Clear, simple language
- Mobile-friendly layout

---

#### 🧱 Section-4: Application Split (Core of Hub)
**Two-column layout:**

**🟦 Left Column: Ceiling Panels**
- **Title**: `Ceiling Panels`
- **Features**:
  - Indoor / semi-covered
  - Lightweight
  - Clip-in system
  - Easy maintenance
- **Button**: `View Ceiling System →`

**🟥 Right Column: Cladding Panels**
- **Title**: `Cladding Panels`
- **Features**:
  - Exterior façade
  - High wind resistance
  - Back-frame fixing
  - Structural support required
- **Button**: `View Cladding System →`

**Design Notes:**
- Equal column widths
- Color-coded (blue for ceiling, red for cladding)
- Clear visual separation
- Mobile: Stack columns

---

#### 🧪 Section-5: Material Philosophy (Authority)
**Content:**
```
Currently available in Aluminium.
Other materials (GI / MS) shown for technical comparison only.
```

**Purpose**: Sell + Educate simultaneously

**Design Notes:**
- Subtle background
- Professional tone
- Builds trust

---

#### 🧾 Section-6: Why No Catalog (Brand Statement)
**Content:**
```
We do not use static catalogs.
This website works as a live, up-to-date product reference with 
configurable designs, system data and calculations.
```

**Design Notes:**
- Bold statement
- Different background color
- Reinforces value proposition

---

## 🔵 PAGE-2: CEILING SYSTEM PAGE (`ceiling-system.html`)

### Purpose
Interior architects + contractors ke liye. Engineering + Calculator.

### Section Breakdown

#### 🧱 Section-1: System Introduction
**Content:**
- **Heading**: `Perforated Aluminium Ceiling Panel System`
- **Intro text**: `Lightweight perforated panels designed for interior ceiling applications using clip-in fixing mechanisms.`

**Design Notes:**
- Clear heading hierarchy
- Professional introduction

---

#### 🎨 Section-2: Live Design Preview
**Content:**
- Selected design SVG (from hub page selection or default)
- Color options (dropdown/buttons)
- Front view only
- **Note**: `Visual shown is front face. Side bends shown for reference.`

**Technical Implementation:**
- JavaScript to load selected design
- Color picker/switcher
- SVG manipulation for color changes

---

#### 🔩 Section-3: Fabrication Details
**Content (Bullet Points):**
- Material: Aluminium
- **Thickness Options**: 
  - 1.0 mm (Standard)
  - 1.2 mm (Heavy-duty)
  - 1.5 mm (Premium)
- Side bends: 20 mm (2 sides), 35 mm (2 sides)
- Corner cut-outs for hanger seating
- CNC perforated front face

**Panel Sizes (Standard):**
- Custom sizes available (specify in calculator)
- Standard widths: 300mm, 400mm, 500mm, 600mm
- Standard lengths: 600mm, 900mm, 1200mm, 1500mm, 1800mm, 2400mm
- Custom dimensions: Up to 3000mm length (subject to engineering)

**Design Notes:**
- Technical table or bullet list
- Clear formatting
- Easy to scan
- Show thickness options prominently
- Panel sizes in table format

---

#### 🔗 Section-4: Fixing System (Ceiling)
**Content (Bullet Points):**
- Clip-in / carrier based system
- Gravity load only
- Easy removal & access
- Suitable for services integration

**Design Notes:**
- Technical illustration (optional)
- Clear bullet points
- Contractor-friendly language

---

#### 🧮 Section-5: Price Calculator (Aluminium Only)
**Purpose:** 
- Help homeowners estimate costs
- Assist architects in budget planning
- Enable builders to quote accurately
- Provide instant pricing transparency

**Inputs:**
- Width (with unit selector: mm, cm, ft, m)
- Height/Length (with unit selector: mm, cm, ft, m)
- **Thickness Selection** (Dropdown):
  - 1.0 mm (Standard)
  - 1.2 mm (Heavy-duty)
  - 1.5 mm (Premium)
- Quantity

**Outputs:**
- Area (sqft)
- Approx weight (kg) - based on selected thickness
- Indicative price range (₹) - varies with thickness
- Price per sqft (for reference)

**Calculator Features:**
- Real-time calculation
- Multiple unit support
- Thickness-based pricing
- Weight calculation
- Email quote option

**⚠️ Disclaimer:**
`Rates are indicative. Final quotation based on drawings & finish.`

**Technical Implementation:**
- Use existing calculator system (`js/calculator/base.js`)
- Add config to `data/products.json`
- Create extension file: `js/calculator/extensions/perforated-ceiling-calculator.js`

**Calculator Logic:**
```
Area (sqft) = (Width × Height × Quantity) → Convert to sqft
Weight (kg) = Area × Thickness × Aluminium density (2.7 g/cm³) × conversion factors
Price = Area × Rate per sqft (varies by thickness from products.json)
```

**Thickness-based Pricing:**
- 1.0 mm: Base rate
- 1.2 mm: Base rate + 15-20%
- 1.5 mm: Base rate + 30-40%

**Educational Content Around Calculator:**
- How to measure your space
- Understanding thickness options
- When to choose which thickness
- Getting accurate quotes

---

#### 🌬 Section-6: Performance Snapshot
**Content (Checkmarks):**
- ✔ Lightweight
- ✔ Low wind exposure
- ✔ Indoor application
- ✔ Long coating life
- ✔ Low maintenance

**Design Notes:**
- Visual checkmarks
- Clean list format
- Easy to understand

---

## 🔴 PAGE-3: CLADDING SYSTEM PAGE (`cladding-system.html`)

### Purpose
Façade consultants + engineers ke liye. Wind + Fixing + Performance.

### Section Breakdown

#### 🧱 Section-1: System Introduction
**Content:**
- **Heading**: `Perforated Aluminium Cladding Panel System`
- **Intro**: `Engineered perforated panel systems designed to withstand exterior wind pressure and environmental exposure.`

**Design Notes:**
- Professional, engineering-focused tone
- Emphasize "engineered" aspect

---

#### 🎨 Section-2: Design Preview (Same Design)
**Content:**
- Same SVG design (from hub/ceiling page)
- Same colors
- Technical overlays visible (light grey)
- **Text**: `Same design. Different engineering.`

**Design Notes:**
- Show same design but emphasize engineering differences
- Technical overlay visualization

---

#### 🔩 Section-3: Fabrication Details (Cladding/Elevation)
**Content (Bullet Points):**
- Material: Aluminium
- **Thickness Options** (Elevation/Cladding):
  - 2.0 mm (Standard elevation)
  - 2.5 mm (Heavy-duty elevation)
  - 3.0 mm (Premium/High-rise elevation)
- Reinforced side bends
- Stiffeners / back support as required
- CNC perforation pattern

**Panel Sizes (Elevation/Cladding):**
- Custom sizes available (specify in calculator)
- Standard widths: 400mm, 500mm, 600mm, 800mm, 1000mm
- Standard lengths: 1200mm, 1500mm, 1800mm, 2400mm, 3000mm
- Custom dimensions: Up to 4000mm length (subject to engineering & wind load analysis)
- **Note**: Larger panels require structural engineering approval

**Design Notes:**
- Compare with ceiling specs (show difference)
- Technical details emphasized
- Show thickness options prominently
- Panel sizes in table format
- Emphasize structural requirements for larger sizes

---

#### 🌬 Section-4: Wind & Structural Logic (SAFE)
**Content:**
- **Heading**: `Wind & Structural Performance`
- **Text**: 
  ```
  Designed for exterior wind loads.
  Performance depends on:
  – Panel size
  – Fixing system
  – Wind zone
  – Building height
  Engineering confirmation recommended for high-rise façades.
  ```

**Design Notes:**
- Safety-focused language
- Clear warnings
- Professional engineering tone

---

#### 🔗 Section-5: Fixing System (Cladding)
**Content (Bullet Points):**
- Back-frame support
- Hanger / cleat fixing
- Mechanical locking
- Designed for suction & pressure loads

**Design Notes:**
- More technical than ceiling fixing
- Emphasize structural requirements
- Engineering diagrams (optional)

---

#### 🧪 Section-6: Material Comparison (Education Layer)
**Content (Table):**

| Material | Thickness | Weight | Coating Life | Cost (₹/sft) | Suitability |
|----------|-----------|--------|--------------|---------------|-------------|
| Aluminium | 2.0–3.0 mm | Light | Long | Higher | Best |
| GI | 0.5–0.7 mm | Heavy | Medium | ~120 | Limited |
| MS | 0.7 mm | Heavy | Low | Lower | Short term |

**Note:**
`Currently supplied in aluminium (2mm, 2.5mm, 3mm). Other materials shown for reference.`

**Design Notes:**
- Responsive table
- Mobile: Convert to cards or accordion
- Clear comparison

---

#### 🧮 Section-6A: Price Calculator (Cladding/Elevation)
**Purpose:**
- Help architects estimate project costs
- Assist engineers in material planning
- Enable builders to prepare quotes
- Provide transparency for clients

**Inputs:**
- Width (with unit selector: mm, cm, ft, m)
- Height/Length (with unit selector: mm, cm, ft, m)
- **Thickness Selection** (Dropdown):
  - 2.0 mm (Standard elevation)
  - 2.5 mm (Heavy-duty elevation)
  - 3.0 mm (Premium/High-rise)
- Quantity
- **Wind Zone** (Optional - for engineering reference):
  - Zone I (Low wind)
  - Zone II (Moderate wind)
  - Zone III (High wind)
  - Zone IV (Very high wind)

**Outputs:**
- Area (sqft)
- Approx weight (kg) - based on selected thickness
- Indicative price range (₹) - varies with thickness
- Price per sqft (for reference)
- **Engineering Note**: Approval required for Zone III & IV and panels > 3000mm

**Calculator Features:**
- Real-time calculation
- Multiple unit support
- Thickness-based pricing (2mm, 2.5mm, 3mm)
- Weight calculation
- Wind zone guidance
- Email quote option

**⚠️ Disclaimer:**
`Rates are indicative. Final quotation based on drawings, wind load analysis & finish. Engineering confirmation required for high-rise applications (> 3 floors) and large panels (> 3000mm).`

**Technical Implementation:**
- Use existing calculator system (`js/calculator/base.js`)
- Add config to `data/products.json`
- Create extension file: `js/calculator/extensions/perforated-cladding-calculator.js`
- Include wind zone factor in calculations

**Calculator Logic:**
```
Area (sqft) = (Width × Height × Quantity) → Convert to sqft
Weight (kg) = Area × Thickness × Aluminium density (2.7 g/cm³) × conversion factors
Price = Area × Rate per sqft (varies by thickness from products.json)
Wind Zone Factor = Additional cost for Zone III/IV (if applicable)
```

**Thickness-based Pricing:**
- 2.0 mm: Base rate
- 2.5 mm: Base rate + ~18%
- 3.0 mm: Base rate + ~38%

**Educational Content Around Calculator:**
- How to measure elevation area
- Understanding thickness selection
- Wind zone explanation
- When engineering approval is needed
- Getting accurate quotes

---

#### 🧠 Section-7: Thickness Selection Guide
**Content (Table/Guide):**

| Application | Recommended Thickness | Use Case |
|-------------|----------------------|----------|
| Low-rise elevation (< 3 floors) | 2.0 mm | Standard residential/commercial |
| Mid-rise elevation (3-10 floors) | 2.5 mm | Commercial buildings, offices |
| High-rise elevation (> 10 floors) | 3.0 mm | Premium projects, high wind zones |
| Wind Zone III/IV | 2.5-3.0 mm | High wind resistance required |

**Note:**
`Thickness selection depends on panel size, wind zone, building height, and fixing system. Engineering consultation recommended for projects above 3 floors.`

**Design Notes:**
- Clear selection guide
- Help architects/engineers choose right thickness
- Safety-focused recommendations

---

#### 🧠 Section-8: Decision Summary
**Content (Checkmarks):**
- ✔ Suitable for exterior façades
- ✔ High design flexibility
- ✔ Lightweight vs steel alternatives
- ✔ Long-term durability
- ✔ Engineered fixing system

**Design Notes:**
- Summary format
- Reinforce benefits
- Easy to scan

---

## 🛠️ TECHNICAL IMPLEMENTATION PLAN

### 1. HTML Structure
- Follow existing product page structure
- Use semantic HTML5
- Include all meta tags (SEO, Open Graph, Schema.org)
- Mobile-responsive from start

### 2. CSS Styling
- Create `css/perforated-panels.css`
- Use existing CSS variables from `styles.css`
- Follow existing design patterns
- Ensure mobile responsiveness

### 3. JavaScript Features
- **Design Preview**: `js/perforated-panels.js`
  - SVG loading
  - Color switching
  - Hover effects
  - Scroll to section
  
- **Calculator**: Use existing calculator system
  - Add config to `data/products.json`
  - Create extension: `js/calculator/extensions/perforated-ceiling-calculator.js`
  - Note: Cladding calculator can be added later if needed

### 4. Data Structure (`data/products.json`)
```json
{
  "perforated-ceiling-panels": {
    "id": "perforated-ceiling-panels",
    "name": "Perforated Aluminium Ceiling Panels",
    "rates": {
      "baseRate": 450,
      "useGlobalRates": false,
      "thickness": {
        "1.0mm": 0,
        "1.2mm": 75,
        "1.5mm": 150
      },
      "standardSizes": {
        "300x600": 0,
        "300x900": 0,
        "300x1200": 0,
        "400x600": 0,
        "400x900": 0,
        "400x1200": 0,
        "500x600": 0,
        "500x900": 0,
        "500x1200": 0,
        "600x600": 0,
        "600x900": 0,
        "600x1200": 0,
        "custom": 50
      }
    },
    "features": ["clip-in", "lightweight", "indoor"],
    "thicknessOptions": ["1.0mm", "1.2mm", "1.5mm"],
    "standardWidths": [300, 400, 500, 600],
    "standardLengths": [600, 900, 1200, 1500, 1800, 2400]
  },
  "perforated-cladding-panels": {
    "id": "perforated-cladding-panels",
    "name": "Perforated Aluminium Cladding/Elevation Panels",
    "rates": {
      "baseRate": 650,
      "useGlobalRates": false,
      "thickness": {
        "2.0mm": 0,
        "2.5mm": 120,
        "3.0mm": 250
      },
      "standardSizes": {
        "400x1200": 0,
        "400x1500": 0,
        "400x1800": 0,
        "400x2400": 0,
        "500x1200": 0,
        "500x1500": 0,
        "500x1800": 0,
        "500x2400": 0,
        "500x3000": 0,
        "600x1200": 0,
        "600x1500": 0,
        "600x1800": 0,
        "600x2400": 0,
        "600x3000": 0,
        "800x1500": 0,
        "800x1800": 0,
        "800x2400": 0,
        "800x3000": 0,
        "1000x1500": 0,
        "1000x1800": 0,
        "1000x2400": 0,
        "1000x3000": 0,
        "custom": 100
      }
    },
    "features": ["back-frame", "wind-resistant", "exterior"],
    "thicknessOptions": ["2.0mm", "2.5mm", "3.0mm"],
    "standardWidths": [400, 500, 600, 800, 1000],
    "standardLengths": [1200, 1500, 1800, 2400, 3000],
    "maxCustomLength": 4000
  }
}
```

### 5. SVG Design Files
- Create 4-5 SVG design patterns
- Store in `images/products/perforated-panels/designs/`
- Optimize for web
- Ensure color customization capability

---

## 📱 RESPONSIVE DESIGN PLAN

### Mobile (< 768px)
- Stack columns vertically
- Full-width buttons
- Simplified navigation
- Touch-friendly interactions

### Tablet (768px - 1024px)
- Two-column layouts where appropriate
- Adjusted spacing
- Optimized images

### Desktop (> 1024px)
- Full multi-column layouts
- Hover effects
- Enhanced interactions

---

## 🎨 DESIGN SYSTEM

### Colors (Use Existing)
- Primary: `--accent-primary` (#1E40AF - Dark Blue)
- Secondary: `--accent-secondary` (#059669 - Premium Green)
- Ceiling: Blue tones
- Cladding: Red/Bronze tones

### Typography
- Use existing font stack
- Clear hierarchy
- Readable sizes

### Spacing
- Consistent padding/margins
- Follow existing patterns

---

## 🔍 COMPREHENSIVE SEO & CONTENT STRATEGY

### 🎯 Target Audience
1. **Homeowners** - DIY enthusiasts, home renovation
2. **Architects** - Design specifications, technical data
3. **Project Engineers** - Structural requirements, wind loads
4. **Builders/Contractors** - Installation, pricing, practical details

### 📊 TARGETED KEYWORDS (What People Search)

#### Primary Keywords (High Volume)
- perforated aluminium panels
- perforated aluminium ceiling panels
- perforated aluminium cladding panels
- perforated metal ceiling panels
- perforated aluminium elevation panels
- aluminium perforated sheet price
- perforated ceiling panels price
- perforated cladding panels cost

#### Long-tail Keywords (Specific Intent)
- perforated aluminium ceiling panels price calculator
- perforated aluminium cladding panels installation
- perforated aluminium panels for building elevation
- perforated ceiling panels thickness options
- perforated aluminium panels 2mm 3mm price
- perforated aluminium panels standard sizes
- perforated aluminium panels fixing system
- perforated aluminium panels wind load calculation

#### Location-based Keywords
- perforated aluminium panels hyderabad
- perforated aluminium panels delhi
- perforated aluminium panels bangalore
- perforated aluminium panels mumbai
- perforated aluminium panels pune
- perforated aluminium panels india

#### Problem-solving Keywords
- how to install perforated aluminium ceiling panels
- perforated aluminium panels vs GI panels
- perforated aluminium panels thickness guide
- perforated aluminium panels wind resistance
- perforated aluminium panels price per sqft

### 📝 PAGE-SPECIFIC SEO STRATEGY

#### 🔷 HUB PAGE SEO

**Title Tag:**
```
Perforated Aluminium Panels for Ceiling & Cladding | Price Calculator | WoodenMax
```

**Meta Description:**
```
Design-driven perforated aluminium panels for ceilings & building elevation. Free price calculator, installation guide, thickness options (1mm-3mm). Standard sizes available. Suitable for homeowners, architects, builders. Pan-India delivery.
```

**Target Keywords:**
- Primary: perforated aluminium panels, perforated aluminium ceiling panels, perforated aluminium cladding panels
- Secondary: perforated metal panels, aluminium perforated sheet, perforated panels price

**Schema.org Markup:**
- `CollectionPage` or `WebPage`
- `BreadcrumbList`
- `HowTo` (for usage guide)
- `FAQPage` (if FAQ section added)

**AI Tools Meta Tags:**
```html
<meta name="ai:tool" content="Perforated Aluminium Panels Price Calculator" />
<meta name="ai:tool:type" content="Live Price Calculator & Product Reference" />
<meta name="ai:tool:features" content="Design Selection, Thickness Selection, Size Input, Real-time Price Calculation, Installation Guide" />
<meta name="ai:tool:products" content="Perforated Aluminium Ceiling Panels, Perforated Aluminium Cladding Panels, Elevation Panels" />
<meta name="ai:tool:input" content="Width, Height, Thickness, Quantity, Design Pattern" />
<meta name="ai:tool:output" content="Instant Price Estimate, Weight Calculation, Area Calculation" />
<meta name="ai:tool:useCase" content="Ceiling Design, Building Elevation, Facade Cladding, Interior Design" />
<meta name="ai:tool:audience" content="Homeowners, Architects, Project Engineers, Builders, Contractors, Interior Designers" />
```

---

#### 🔵 CEILING SYSTEM PAGE SEO

**Title Tag:**
```
Perforated Aluminium Ceiling Panels | 1mm 1.2mm 1.5mm | Price Calculator | Installation Guide
```

**Meta Description:**
```
Perforated aluminium ceiling panels for interior applications. Thickness: 1mm, 1.2mm, 1.5mm. Clip-in fixing system. Free price calculator. Standard sizes available. Installation guide included. Suitable for homes, offices, commercial spaces.
```

**Target Keywords:**
- Primary: perforated aluminium ceiling panels, perforated ceiling panels, aluminium ceiling panels
- Secondary: perforated ceiling panels price, perforated ceiling panels installation, clip-in ceiling panels
- Long-tail: perforated aluminium ceiling panels 1mm price, perforated ceiling panels standard sizes

**Product Snippet (Rich Results):**
- Price range: ₹450-650 per sqft (varies by thickness)
- Thickness options: 1.0mm, 1.2mm, 1.5mm
- Standard sizes: 300-600mm width, 600-2400mm length
- Application: Indoor ceiling
- Fixing: Clip-in system

**Schema.org Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Perforated Aluminium Ceiling Panels",
  "description": "Lightweight perforated aluminium ceiling panels with clip-in fixing system. Available in 1mm, 1.2mm, 1.5mm thickness. Standard sizes 300-600mm width, 600-2400mm length.",
  "brand": {"@type": "Brand", "name": "WoodenMax"},
  "category": "Ceiling Panels",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": 450,
    "highPrice": 650,
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "priceCurrency": "INR",
      "price": 450,
      "unitCode": "SQFT"
    }
  },
  "additionalProperty": [
    {"@type": "PropertyValue", "name": "Thickness", "value": "1.0mm, 1.2mm, 1.5mm"},
    {"@type": "PropertyValue", "name": "Material", "value": "Aluminium"},
    {"@type": "PropertyValue", "name": "Application", "value": "Indoor Ceiling"},
    {"@type": "PropertyValue", "name": "Fixing System", "value": "Clip-in/Carrier"}
  ]
}
```

**AI Tools Meta Tags:**
```html
<meta name="ai:tool" content="Perforated Aluminium Ceiling Panels Price Calculator" />
<meta name="ai:tool:type" content="Live Price Calculator" />
<meta name="ai:tool:features" content="Thickness Selection (1mm/1.2mm/1.5mm), Size Input, Quantity, Real-time Price & Weight Calculation" />
<meta name="ai:tool:products" content="Perforated Aluminium Ceiling Panels" />
<meta name="ai:tool:input" content="Width, Height, Thickness (1mm/1.2mm/1.5mm), Quantity" />
<meta name="ai:tool:output" content="Area (sqft), Weight (kg), Indicative Price (₹)" />
<meta name="ai:tool:useCase" content="Interior Ceiling Design, Office Ceiling, Home Renovation, Commercial Ceiling" />
<meta name="ai:tool:audience" content="Homeowners, Architects, Interior Designers, Contractors, Builders" />
```

---

#### 🔴 CLADDING SYSTEM PAGE SEO

**Title Tag:**
```
Perforated Aluminium Cladding Panels | 2mm 2.5mm 3mm | Elevation Panels | Wind Load Guide
```

**Meta Description:**
```
Engineered perforated aluminium cladding panels for building elevation. Thickness: 2mm, 2.5mm, 3mm. Wind-resistant, back-frame fixing. Free price calculator. Thickness selection guide. Suitable for low-rise to high-rise buildings.
```

**Target Keywords:**
- Primary: perforated aluminium cladding panels, perforated aluminium elevation panels, perforated cladding panels
- Secondary: perforated elevation panels, aluminium facade panels, perforated cladding panels price
- Long-tail: perforated aluminium panels 2mm 3mm price, perforated cladding panels wind load, elevation panels thickness guide

**Product Snippet (Rich Results):**
- Price range: ₹650-900 per sqft (varies by thickness)
- Thickness options: 2.0mm, 2.5mm, 3.0mm
- Standard sizes: 400-1000mm width, 1200-3000mm length
- Application: Exterior elevation/cladding
- Fixing: Back-frame/Hanger system
- Wind resistance: Zone I-IV compatible

**Schema.org Markup:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Perforated Aluminium Cladding/Elevation Panels",
  "description": "Engineered perforated aluminium cladding panels for building elevation. Available in 2mm, 2.5mm, 3mm thickness. Designed for wind loads. Back-frame fixing system.",
  "brand": {"@type": "Brand", "name": "WoodenMax"},
  "category": "Cladding Panels",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": 650,
    "highPrice": 900,
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "priceCurrency": "INR",
      "price": 650,
      "unitCode": "SQFT"
    }
  },
  "additionalProperty": [
    {"@type": "PropertyValue", "name": "Thickness", "value": "2.0mm, 2.5mm, 3.0mm"},
    {"@type": "PropertyValue", "name": "Material", "value": "Aluminium"},
    {"@type": "PropertyValue", "name": "Application", "value": "Exterior Elevation/Cladding"},
    {"@type": "PropertyValue", "name": "Fixing System", "value": "Back-frame/Hanger"},
    {"@type": "PropertyValue", "name": "Wind Resistance", "value": "Zone I-IV"}
  ]
}
```

**AI Tools Meta Tags:**
```html
<meta name="ai:tool" content="Perforated Aluminium Cladding Panels Price Calculator" />
<meta name="ai:tool:type" content="Live Price Calculator & Engineering Guide" />
<meta name="ai:tool:features" content="Thickness Selection (2mm/2.5mm/3mm), Size Input, Wind Zone Selection, Real-time Price & Weight Calculation" />
<meta name="ai:tool:products" content="Perforated Aluminium Cladding Panels, Elevation Panels" />
<meta name="ai:tool:input" content="Width, Height, Thickness (2mm/2.5mm/3mm), Quantity, Wind Zone (Optional)" />
<meta name="ai:tool:output" content="Area (sqft), Weight (kg), Indicative Price (₹), Engineering Recommendations" />
<meta name="ai:tool:useCase" content="Building Elevation, Facade Cladding, Exterior Design, High-rise Buildings" />
<meta name="ai:tool:audience" content="Architects, Project Engineers, Builders, Façade Consultants, Construction Companies" />
```

---

### 📚 CONTENT STRATEGY (Educational Focus)

#### Key Content Sections (All Pages)

**1. What Are Perforated Aluminium Panels?**
- Definition and explanation
- Common applications
- Benefits overview

**2. Ceiling vs Cladding - Key Differences**
- Application differences
- Thickness differences
- Fixing system differences
- Use case examples

**3. Thickness Selection Guide**
- When to use 1mm/1.2mm/1.5mm (ceiling)
- When to use 2mm/2.5mm/3mm (cladding)
- Building height considerations
- Wind zone considerations

**4. Standard Sizes & Custom Options**
- Standard size tables
- Custom size availability
- Engineering requirements

**5. Installation System Explained**
- **Ceiling**: Clip-in system, carrier installation, step-by-step guide
- **Cladding**: Back-frame system, hanger fixing, structural requirements

**6. Use Cases & Applications**
- **Ceiling**: Homes, offices, commercial spaces, restaurants
- **Cladding**: Residential buildings, commercial buildings, high-rise, facades

**7. Price Calculator Guide**
- How to use calculator
- Understanding results
- Getting accurate quotes

**8. Material Comparison**
- Aluminium vs GI vs MS
- Cost comparison
- Durability comparison
- Suitability guide

---

### 🎓 EDUCATIONAL CONTENT FOCUS

#### For Homeowners
- **Simple language** - No technical jargon
- **Visual guides** - Images, diagrams
- **Cost transparency** - Clear pricing
- **DIY tips** - Basic installation understanding
- **Use cases** - Real examples

**Key Features to Highlight:**
- Easy maintenance
- Long-lasting
- Modern design
- Cost-effective
- Customizable

#### For Architects
- **Technical specifications** - Detailed data
- **Design flexibility** - Pattern options
- **Engineering data** - Wind loads, structural requirements
- **Standard sizes** - Quick reference
- **Material properties** - Technical details

**Key Features to Highlight:**
- Design patterns available
- Thickness options
- Standard sizes
- Custom fabrication
- Engineering support

#### For Project Engineers
- **Structural requirements** - Detailed engineering
- **Wind load calculations** - Zone-based guidance
- **Fixing system details** - Technical specifications
- **Material properties** - Aluminium specifications
- **Safety factors** - Engineering recommendations

**Key Features to Highlight:**
- Wind resistance data
- Structural support requirements
- Thickness selection guide
- Engineering approval process
- Safety standards

#### For Builders/Contractors
- **Installation guide** - Step-by-step
- **Fixing system** - Practical details
- **Tools required** - Equipment list
- **Time estimates** - Installation duration
- **Cost factors** - Material + labor

**Key Features to Highlight:**
- Easy installation
- Standard sizes
- Fixing system clarity
- Maintenance access
- Durability

---

### 🔧 INSTALLATION SYSTEM CONTENT

#### Ceiling Installation (Detailed Section)

**Section Title:** "Installation System - Clip-in Ceiling Panels"

**Content Structure:**
1. **System Overview**
   - Clip-in/carrier based system
   - Gravity load only
   - Easy removal for maintenance

2. **Components Required**
   - Perforated panels
   - Carrier system
   - Hanger brackets
   - Corner clips

3. **Step-by-Step Installation**
   - Step 1: Marking and layout
   - Step 2: Install carrier system
   - Step 3: Install hanger brackets
   - Step 4: Insert panels (clip-in)
   - Step 5: Final adjustments

4. **Tools Required**
   - Measuring tape
   - Level
   - Drill machine
   - Screwdriver
   - Panel lifter (optional)

5. **Maintenance & Access**
   - Easy panel removal
   - Services integration
   - Cleaning access

**Visual Aids:**
- Installation diagram
- Component images
- Step-by-step images

---

#### Cladding Installation (Detailed Section)

**Section Title:** "Installation System - Back-frame Cladding Panels"

**Content Structure:**
1. **System Overview**
   - Back-frame support system
   - Hanger/cleat fixing
   - Mechanical locking
   - Designed for wind loads

2. **Components Required**
   - Perforated panels
   - Back-frame structure
   - Hanger brackets
   - Cleat system
   - Stiffeners (if required)

3. **Step-by-Step Installation**
   - Step 1: Structural assessment
   - Step 2: Install back-frame
   - Step 3: Install hanger brackets
   - Step 4: Mount panels
   - Step 5: Secure with cleats
   - Step 6: Final inspection

4. **Engineering Requirements**
   - Structural approval
   - Wind load analysis
   - Fixing point calculation
   - Safety factors

5. **Tools Required**
   - Measuring equipment
   - Welding equipment (if needed)
   - Drill machine
   - Level
   - Safety equipment

**Visual Aids:**
- Installation diagram
- Structural details
- Fixing system details
- Safety guidelines

---

### 💡 USE CASES & APPLICATIONS

#### Ceiling Use Cases

**1. Residential Homes**
- Living room ceiling
- Bedroom ceiling
- Kitchen ceiling
- Balcony ceiling (semi-covered)

**2. Commercial Spaces**
- Office ceilings
- Restaurant ceilings
- Retail store ceilings
- Showroom ceilings

**3. Special Applications**
- False ceiling with services
- Acoustic ceiling (with backing)
- Decorative ceiling
- Feature ceiling

**Visual Examples:**
- Before/after images
- Real project photos
- Design variations

---

#### Cladding Use Cases

**1. Residential Buildings**
- Villa elevation
- Apartment building facade
- Boundary wall cladding
- Entrance feature wall

**2. Commercial Buildings**
- Office building elevation
- Shopping mall facade
- Hotel elevation
- Institutional buildings

**3. Special Applications**
- High-rise building facade
- Wind-resistant elevation
- Decorative facade
- Feature wall

**Visual Examples:**
- Project case studies
- Elevation designs
- Installation photos

---

### 📱 CONTENT FORMATTING

#### Headings Hierarchy
- H1: Main page title (one per page)
- H2: Major sections (Installation, Use Cases, etc.)
- H3: Subsections (Step-by-step, Components, etc.)
- H4: Details (if needed)

#### Content Structure
- Short paragraphs (2-3 sentences)
- Bullet points for lists
- Tables for specifications
- Visual breaks between sections
- Call-to-action buttons

#### Internal Linking
- Link to calculator from content
- Link between ceiling and cladding pages
- Link to related products
- Link to contact page

---

### 🎯 GOOGLE RICH RESULTS OPTIMIZATION

#### Product Rich Snippets
- Price range
- Thickness options
- Availability
- Rating (if available)

#### FAQ Schema (Optional)
- Common questions
- Detailed answers
- Structured data markup

#### HowTo Schema (Installation)
- Step-by-step installation
- Tools required
- Time required
- Visual aids

#### Breadcrumb Schema
- Home > Products > Perforated Panels > Ceiling/Cladding

---

### 📊 CONTENT METRICS & GOALS

#### Engagement Goals
- Time on page: > 3 minutes
- Scroll depth: > 75%
- Calculator usage: > 40% of visitors
- Bounce rate: < 50%

#### Conversion Goals
- Form submissions
- Calculator usage
- Contact inquiries
- Quote requests

---

### URLs
- Clean, descriptive URLs
- No .html extension (handled by .htaccess)
- Canonical tags
- Proper redirects

---

## 📊 ANALYTICS & TRACKING

### Events to Track
- Design selection clicks
- System page visits (Ceiling vs Cladding)
- Calculator usage (both pages)
- Thickness selection in calculator
- CTA button clicks
- Form submissions
- Installation guide views
- Use case section engagement
- Scroll depth per section

### Implementation
- Use existing `js/analytics.js`
- Add custom event tracking
- Google Analytics integration
- Track calculator conversions
- Monitor content engagement

---

## 🎓 EDUCATIONAL CONTENT STRUCTURE

### Content Philosophy
**Website = Catalog + Educational Resource**

- **No PDF dependency** - All information on website
- **Live & updated** - Always current information
- **Educational** - Teach while selling
- **Transparent** - Show limitations, disclaimers
- **Multi-audience** - Serve homeowners, architects, engineers, builders

### Key Content Sections (All Pages)

#### 1. What Are Perforated Aluminium Panels?
**Target:** Homeowners, General audience
- Simple explanation
- Visual examples
- Common applications
- Benefits overview

#### 2. Ceiling vs Cladding - Key Differences
**Target:** All audiences
- Application differences (indoor vs exterior)
- Thickness differences (1-1.5mm vs 2-3mm)
- Fixing system differences
- Use case examples
- Visual comparison

#### 3. Thickness Selection Guide
**Target:** Architects, Engineers, Builders
- When to use 1mm/1.2mm/1.5mm (ceiling)
- When to use 2mm/2.5mm/3mm (cladding)
- Building height considerations
- Wind zone considerations
- Panel size considerations
- Decision table/flowchart

#### 4. Standard Sizes & Custom Options
**Target:** Architects, Builders
- Standard size tables (both systems)
- Custom size availability
- Engineering requirements
- Size selection guide

#### 5. Installation System Explained (Detailed)
**Target:** Contractors, Builders, DIY enthusiasts

**Ceiling Installation:**
- System overview
- Components required
- Step-by-step installation guide
- Tools required
- Maintenance & access
- Visual aids (diagrams, images)

**Cladding Installation:**
- System overview
- Components required
- Step-by-step installation guide
- Engineering requirements
- Tools required
- Safety guidelines
- Visual aids (diagrams, images)

#### 6. Use Cases & Applications
**Target:** All audiences

**Ceiling Use Cases:**
- Residential homes (living room, bedroom, kitchen)
- Commercial spaces (office, restaurant, retail)
- Special applications (false ceiling, acoustic, decorative)

**Cladding Use Cases:**
- Residential buildings (villa, apartment, boundary wall)
- Commercial buildings (office, mall, hotel)
- Special applications (high-rise, wind-resistant, decorative)

**Visual Examples:**
- Before/after images
- Real project photos
- Design variations
- Case studies

#### 7. Price Calculator Guide
**Target:** All audiences
- How to use calculator
- Understanding inputs
- Understanding outputs
- Getting accurate quotes
- When to contact for final quote

#### 8. Material Comparison
**Target:** Architects, Engineers, Builders
- Aluminium vs GI vs MS
- Cost comparison table
- Durability comparison
- Suitability guide
- Why aluminium is preferred

---

## 🎯 KEY FEATURES FOCUS BY AUDIENCE

### For Homeowners
**Key Features to Highlight:**
- ✅ Easy maintenance
- ✅ Long-lasting durability
- ✅ Modern design options
- ✅ Cost-effective solution
- ✅ Customizable designs
- ✅ Easy installation (ceiling)
- ✅ Low maintenance

**Content Tone:**
- Simple language
- Visual guides
- Cost transparency
- Real examples
- Benefits-focused

### For Architects
**Key Features to Highlight:**
- ✅ Design flexibility (multiple patterns)
- ✅ Thickness options (1-3mm)
- ✅ Standard sizes available
- ✅ Custom fabrication possible
- ✅ Technical specifications
- ✅ Engineering support
- ✅ Material properties

**Content Tone:**
- Technical specifications
- Detailed data
- Design options
- Standard references
- Professional language

### For Project Engineers
**Key Features to Highlight:**
- ✅ Wind resistance data
- ✅ Structural requirements
- ✅ Thickness selection guide
- ✅ Engineering approval process
- ✅ Safety standards compliance
- ✅ Material properties (aluminium)
- ✅ Load calculations

**Content Tone:**
- Engineering-focused
- Technical data
- Safety emphasis
- Standards compliance
- Detailed specifications

### For Builders/Contractors
**Key Features to Highlight:**
- ✅ Easy installation process
- ✅ Standard sizes (faster work)
- ✅ Clear fixing system
- ✅ Maintenance access
- ✅ Durability (less callbacks)
- ✅ Cost-effective
- ✅ Quick installation

**Content Tone:**
- Practical details
- Step-by-step guides
- Installation tips
- Cost factors
- Time estimates

---

## 🤖 AI TOOLS & GOOGLE OPTIMIZATION

### AI Tools Meta Tags (All Pages)
**Purpose:** Help AI tools understand and recommend our calculator

**Hub Page:**
```html
<meta name="ai:tool" content="Perforated Aluminium Panels Price Calculator" />
<meta name="ai:tool:type" content="Live Price Calculator & Product Reference" />
<meta name="ai:tool:features" content="Design Selection, Thickness Selection, Size Input, Real-time Price Calculation, Installation Guide" />
<meta name="ai:tool:products" content="Perforated Aluminium Ceiling Panels, Perforated Aluminium Cladding Panels" />
<meta name="ai:tool:input" content="Width, Height, Thickness, Quantity, Design Pattern" />
<meta name="ai:tool:output" content="Instant Price Estimate, Weight Calculation, Area Calculation" />
<meta name="ai:tool:useCase" content="Ceiling Design, Building Elevation, Facade Cladding, Interior Design" />
<meta name="ai:tool:audience" content="Homeowners, Architects, Project Engineers, Builders, Contractors" />
```

### Google Rich Results
**Product Snippets:**
- Price range
- Thickness options
- Availability
- Rating (if available)

**FAQ Schema (Optional):**
- Common questions
- Detailed answers
- Structured data markup

**HowTo Schema (Installation):**
- Step-by-step installation
- Tools required
- Time required
- Visual aids

**Breadcrumb Schema:**
- Home > Products > Perforated Panels > Ceiling/Cladding

### Google Search Console Optimization
- Submit sitemap
- Monitor search performance
- Track keyword rankings
- Optimize for featured snippets
- Monitor rich results

---

## 📈 CONTENT METRICS & GOALS

### Engagement Goals
- **Time on page**: > 3 minutes
- **Scroll depth**: > 75%
- **Calculator usage**: > 40% of visitors
- **Bounce rate**: < 50%
- **Pages per session**: > 2

### Conversion Goals
- Form submissions
- Calculator usage
- Contact inquiries
- Quote requests
- Installation guide downloads (if PDF version)

### SEO Goals
- Rank for primary keywords
- Featured snippets for "how to" queries
- Rich results for product searches
- Local search visibility

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Setup & Structure
- [ ] Create folder structure
- [ ] Create HTML files (3 pages)
- [ ] Add CSS file
- [ ] Add JavaScript files
- [ ] Create image folders

### Phase 2: Hub Page
- [ ] Hero section
- [ ] Design preview grid
- [ ] How to use section
- [ ] Application split section
- [ ] Material philosophy section
- [ ] Why no catalog section

### Phase 3: Ceiling System Page
- [ ] System introduction
- [ ] Design preview
- [ ] Fabrication details (with thickness options: 1mm, 1.2mm, 1.5mm)
- [ ] Panel sizes table (standard sizes)
- [ ] **Installation system explained** (detailed step-by-step)
- [ ] **Use cases & applications** (residential, commercial, special)
- [ ] Fixing system
- [ ] **Price calculator** (with thickness selector)
- [ ] **Calculator guide** (how to use)
- [ ] Performance snapshot
- [ ] **SEO meta tags** (title, description, keywords)
- [ ] **Schema.org markup** (Product schema)
- [ ] **AI tools meta tags**
- [ ] **Content for all audiences** (homeowners, architects, contractors)

### Phase 4: Cladding System Page
- [ ] System introduction
- [ ] Design preview
- [ ] Fabrication details (with thickness options: 2mm, 2.5mm, 3mm)
- [ ] Panel sizes table (standard sizes for elevation)
- [ ] Wind & structural logic
- [ ] **Installation system explained** (detailed step-by-step)
- [ ] **Use cases & applications** (residential, commercial, high-rise)
- [ ] Fixing system
- [ ] Material comparison table
- [ ] Thickness selection guide (2mm, 2.5mm, 3mm recommendations)
- [ ] **Price calculator** (with thickness selector, wind zone)
- [ ] **Calculator guide** (how to use)
- [ ] Decision summary
- [ ] **SEO meta tags** (title, description, keywords)
- [ ] **Schema.org markup** (Product schema)
- [ ] **AI tools meta tags**
- [ ] **Content for all audiences** (architects, engineers, builders)

### Phase 5: Calculator System
- [ ] Add config to `products.json` (with thickness options & standard sizes)
- [ ] Create calculator extension for ceiling (with thickness selector)
- [ ] Create calculator extension for cladding (with thickness selector, wind zone)
- [ ] Test calculations for all thickness options (1mm, 1.2mm, 1.5mm ceiling)
- [ ] Test calculations for all thickness options (2mm, 2.5mm, 3mm cladding)
- [ ] Test weight calculations based on thickness
- [ ] Test pricing variations by thickness
- [ ] Add standard sizes dropdown (optional enhancement)
- [ ] Add calculator guide content
- [ ] Add disclaimer
- [ ] Email quote functionality
- [ ] Analytics tracking for calculator usage

### Phase 6: SVG Designs
- [ ] Create 4-5 design patterns
- [ ] Optimize SVGs
- [ ] Test color switching
- [ ] Test hover effects

### Phase 7: Integration
- [ ] Add to sitemap.xml
- [ ] Add to ALL_URLS.txt
- [ ] Update navigation (if needed)
- [ ] Test all links

### Phase 8: Testing
- [ ] Mobile responsiveness
- [ ] Cross-browser testing
- [ ] Calculator accuracy
- [ ] Link testing
- [ ] SEO validation
- [ ] Performance testing

### Phase 9: Content Review
- [ ] Language clarity (Architect + Contractor + Customer + Engineers)
- [ ] Technical accuracy
- [ ] No catalog confusion
- [ ] Engineering-safe language
- [ ] Educational content completeness
- [ ] Installation guides clarity
- [ ] Use cases coverage
- [ ] Calculator guides clarity
- [ ] Multi-audience content balance

### Phase 10: SEO & AI Optimization
- [ ] All meta tags (title, description, keywords)
- [ ] Schema.org markup (Product, HowTo, FAQ)
- [ ] AI tools meta tags (all pages)
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URLs
- [ ] Sitemap.xml update
- [ ] ALL_URLS.txt update
- [ ] Rich snippets testing
- [ ] Google Search Console submission

---

## 🚀 FUTURE ENHANCEMENTS (Post-Launch)

1. **Cladding Calculator**: Add calculator for cladding system
2. **Design Customization**: Allow users to customize perforation patterns
3. **3D Preview**: Add 3D visualization of panels
4. **Project Gallery**: Showcase completed projects
5. **Wind Load Calculator**: Add engineering calculator for wind loads
6. **Material Expansion**: Add GI/MS options if business expands

---

## 📝 NOTES

### Language Guidelines
- **Architect-friendly**: Technical terms, specifications, engineering data
- **Contractor-friendly**: Clear instructions, practical details, fixing methods
- **Customer-friendly**: Simple explanations, visual aids, no jargon overload

### Content Philosophy
- **No PDF dependency**: All info on website
- **Live & updated**: Website = catalog
- **Educational**: Teach while selling
- **Transparent**: Show limitations, disclaimers

### Technical Considerations
- **Performance**: Fast loading, optimized images
- **Accessibility**: Semantic HTML, alt text, keyboard navigation
- **SEO**: Proper markup, clean URLs, meta tags
- **Maintainability**: Reusable components, clear structure

---

## 🎯 SUCCESS METRICS

1. **User Understanding**: Clear separation between ceiling and cladding
2. **No Catalog Requests**: Users find all info on website
3. **Calculator Usage**: High engagement with calculator
4. **Page Engagement**: Time on page, scroll depth
5. **Conversion**: Inquiries/leads generated

---

**Document Created**: 2026-01-27
**Status**: Planning Phase
**Next Step**: Review & Approval → Implementation

