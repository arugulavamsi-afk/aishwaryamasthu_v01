# Claude Instructions

## Project Overview

This project focuses on building financial planning tools and calculators such as SIP calculators, loan calculators, tax estimators, and financial comparison tools.

Accuracy, clarity, and reliability are CRITICAL in all implementations.

---

## Core Principles

* Accuracy over everything
* Simplicity in implementation
* Clear and maintainable code
* Reusability of logic across calculators

---

## Financial Calculation Rules (VERY IMPORTANT)

* Always use precise mathematical formulas

* Avoid floating-point errors where possible

* Round values appropriately (2 decimal places unless specified)

* Clearly define:

  * Inputs
  * Outputs
  * Assumptions

* Never hardcode financial constants without explanation

* Always validate user inputs (no negative or invalid values unless logically required)

---

## Calculator Design Standards

For every calculator:

1. Clearly define:

   * Input parameters
   * Output values
   * Formula used

2. Keep calculation logic separate from UI

3. Each calculator should:

   * Be modular
   * Be reusable
   * Be independently testable

---

## Code Structure Guidelines

* Separate files by feature (e.g., home-loan.js, home-loan.js, tax-guide.js)
* Keep utility functions in a common utils module
* Avoid duplication of formulas
* Use meaningful function names (e.g., calculateEMI, calculateSIPReturns)

---

## Behavior Rules for Claude

* ALWAYS explain:

  1. What formula is being used
  2. Why it is correct
  3. Any assumptions made

* Before writing code:

  * Confirm understanding if requirements are unclear

* When modifying code:

  * Explain changes before applying them

---

## Output Expectations

* Provide production-ready code
* Include comments explaining financial logic
* Highlight edge cases (e.g., zero interest, short tenure)

---

## Performance Guidelines

* Avoid unnecessary recalculations
* Optimize for responsiveness in UI-based calculators
* Keep logic efficient and lightweight

---

## Error Handling

* Validate all inputs:

  * Empty values
  * Invalid numbers
  * Edge cases

* Provide meaningful error messages

---

## Financial Domain Awareness

* Be aware of:

  * Indian financial context (SIP, FD, Latest Tax slabs, Home Loans)
  * Compounding frequency (monthly, yearly)
  * EMI calculations
  * Inflation impact (if relevant)

---

## Testing & Validation

* Always verify calculations with sample inputs
* Cross-check outputs with known financial formulas
* Ensure consistency across calculators

---

## Communication Style

* Be clear and structured
* Avoid unnecessary jargon
* Explain financial logic in simple terms when needed

---

## Future Enhancements

* Add support for:

  * Inflation-adjusted returns
  * Tax-aware calculations
  * Scenario comparisons
  * Data visualization dashboards
