# 📐 THICKNESS & PANEL SIZES STRUCTURE

## 🎯 Overview

This document details the thickness options and panel sizes for both Ceiling and Cladding/Elevation panels.

---

## 🔵 CEILING PANELS (Indoor)

### Thickness Options
| Thickness | Use Case | Price Impact |
|-----------|----------|--------------|
| **1.0 mm** | Standard ceiling applications | Base rate |
| **1.2 mm** | Heavy-duty, commercial spaces | Base + 15-20% |
| **1.5 mm** | Premium applications, high traffic | Base + 30-40% |

### Standard Panel Sizes

#### Width Options
- 300 mm
- 400 mm
- 500 mm
- 600 mm

#### Length Options
- 600 mm
- 900 mm
- 1200 mm
- 1500 mm
- 1800 mm
- 2400 mm

#### Custom Sizes
- Maximum length: 3000 mm
- Custom dimensions available (subject to engineering)

### Standard Size Combinations
Common combinations available:
- 300 × 600 mm
- 300 × 900 mm
- 300 × 1200 mm
- 400 × 600 mm
- 400 × 900 mm
- 400 × 1200 mm
- 500 × 600 mm
- 500 × 900 mm
- 500 × 1200 mm
- 600 × 600 mm
- 600 × 900 mm
- 600 × 1200 mm

---

## 🔴 CLADDING/ELEVATION PANELS (Exterior)

### Thickness Options
| Thickness | Use Case | Building Height | Price Impact |
|-----------|----------|-----------------|--------------|
| **2.0 mm** | Standard elevation | Low-rise (< 3 floors) | Base rate |
| **2.5 mm** | Heavy-duty elevation | Mid-rise (3-10 floors) | Base + ~18% |
| **3.0 mm** | Premium/High-rise | High-rise (> 10 floors) | Base + ~38% |

### Thickness Selection Guide

#### By Building Height
- **Low-rise (< 3 floors)**: 2.0 mm recommended
- **Mid-rise (3-10 floors)**: 2.5 mm recommended
- **High-rise (> 10 floors)**: 3.0 mm recommended

#### By Wind Zone
- **Wind Zone I/II**: 2.0-2.5 mm
- **Wind Zone III/IV**: 2.5-3.0 mm (Engineering approval required)

#### By Panel Size
- **Small panels (< 1.5m length)**: 2.0 mm
- **Medium panels (1.5-2.4m length)**: 2.0-2.5 mm
- **Large panels (2.4-3.0m length)**: 2.5 mm
- **Extra large panels (> 3.0m length)**: 2.5-3.0 mm (Engineering approval required)

### Standard Panel Sizes

#### Width Options
- 400 mm
- 500 mm
- 600 mm
- 800 mm
- 1000 mm

#### Length Options
- 1200 mm
- 1500 mm
- 1800 mm
- 2400 mm
- 3000 mm

#### Custom Sizes
- Maximum length: 4000 mm
- Custom dimensions available (subject to engineering & wind load analysis)
- **Note**: Panels above 3000mm require structural engineering approval

### Standard Size Combinations
Common combinations available:
- 400 × 1200 mm
- 400 × 1500 mm
- 400 × 1800 mm
- 400 × 2400 mm
- 500 × 1200 mm
- 500 × 1500 mm
- 500 × 1800 mm
- 500 × 2400 mm
- 500 × 3000 mm
- 600 × 1200 mm
- 600 × 1500 mm
- 600 × 1800 mm
- 600 × 2400 mm
- 600 × 3000 mm
- 800 × 1500 mm
- 800 × 1800 mm
- 800 × 2400 mm
- 800 × 3000 mm
- 1000 × 1500 mm
- 1000 × 1800 mm
- 1000 × 2400 mm
- 1000 × 3000 mm

---

## 📊 Comparison Table

| Feature | Ceiling Panels | Cladding/Elevation Panels |
|---------|---------------|---------------------------|
| **Thickness Range** | 1.0 - 1.5 mm | 2.0 - 3.0 mm |
| **Standard Thickness** | 1.0 mm | 2.0 mm |
| **Heavy-duty** | 1.2 mm | 2.5 mm |
| **Premium** | 1.5 mm | 3.0 mm |
| **Min Width** | 300 mm | 400 mm |
| **Max Width** | 600 mm | 1000 mm |
| **Min Length** | 600 mm | 1200 mm |
| **Max Length** | 3000 mm | 4000 mm |
| **Application** | Indoor/Semi-covered | Exterior façade |
| **Wind Load** | Low (gravity only) | High (suction + pressure) |
| **Fixing System** | Clip-in/Carrier | Back-frame/Hanger |

---

## 🧮 Calculator Integration

### Ceiling Calculator
**Thickness Selector:**
- Dropdown with 3 options: 1.0mm, 1.2mm, 1.5mm
- Price calculation varies by selected thickness
- Weight calculation based on thickness

**Standard Sizes:**
- Optional dropdown for quick selection
- Or custom dimensions input

### Cladding Calculator (Future)
**Thickness Selector:**
- Dropdown with 3 options: 2.0mm, 2.5mm, 3.0mm
- Price calculation varies by selected thickness
- Weight calculation based on thickness
- Wind zone factor (optional)

**Standard Sizes:**
- Optional dropdown for quick selection
- Or custom dimensions input
- Warning for sizes > 3000mm

---

## 📋 Data Structure (products.json)

### Ceiling Panels Config
```json
{
  "thicknessOptions": ["1.0mm", "1.2mm", "1.5mm"],
  "thickness": {
    "1.0mm": 0,
    "1.2mm": 75,
    "1.5mm": 150
  },
  "standardWidths": [300, 400, 500, 600],
  "standardLengths": [600, 900, 1200, 1500, 1800, 2400],
  "maxCustomLength": 3000
}
```

### Cladding Panels Config
```json
{
  "thicknessOptions": ["2.0mm", "2.5mm", "3.0mm"],
  "thickness": {
    "2.0mm": 0,
    "2.5mm": 120,
    "3.0mm": 250
  },
  "standardWidths": [400, 500, 600, 800, 1000],
  "standardLengths": [1200, 1500, 1800, 2400, 3000],
  "maxCustomLength": 4000,
  "engineeringRequiredAbove": 3000
}
```

---

## 🎨 UI/UX Considerations

### Display Format
1. **Thickness Options**: Radio buttons or dropdown (clear labels)
2. **Panel Sizes**: 
   - Table format for standard sizes
   - Input fields for custom sizes
   - Visual size comparison (optional)

### User Guidance
- **Ceiling**: Show thickness impact on weight & price
- **Cladding**: Show thickness selection guide based on building height
- **Warning**: Display engineering requirement notices for large panels

### Mobile Optimization
- Thickness selector: Dropdown (saves space)
- Panel sizes: Accordion or scrollable table
- Clear visual hierarchy

---

## ✅ Implementation Checklist

### Ceiling Page
- [ ] Display thickness options (1.0mm, 1.2mm, 1.5mm)
- [ ] Show standard panel sizes table
- [ ] Integrate thickness selector in calculator
- [ ] Update price calculation based on thickness
- [ ] Update weight calculation based on thickness

### Cladding Page
- [ ] Display thickness options (2.0mm, 2.5mm, 3.0mm)
- [ ] Show standard panel sizes table
- [ ] Add thickness selection guide
- [ ] Show engineering requirements for large panels
- [ ] Future: Integrate thickness selector in calculator

### Calculator
- [ ] Add thickness dropdown to ceiling calculator
- [ ] Update pricing logic for thickness variations
- [ ] Update weight calculation formula
- [ ] Test all thickness options
- [ ] Add standard sizes quick-select (optional)

---

**Last Updated**: 2026-01-27
**Status**: Planning Complete

