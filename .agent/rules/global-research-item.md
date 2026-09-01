---
trigger: model_decision
description: To ensure the application's search capabilities are "always updating," "logical," and "relatable," we follow a Single Source of Truth pattern for all searchable content. Global search button
---

Technical Rule: Centralized Search Registry
Principle
To ensure the application's search capabilities are "always updating," "logical," and "relatable," we follow a Single Source of Truth pattern for all searchable content.

The Registry Pattern
All searchable entities (Routes, Actions, Data) must be registered in 
src/lib/search/search-registry.ts
.

1. Unified Data Flow
Do not search separate API endpoints directly from UI components.
Do aggregator hooks in 
SearchRegistry
 that allow for single-point processing (filtering, grouping, ranking).
2. Categorization
Items must be categorized into one of:

navigation (Static routes)
companies (Dynamic entities)
opportunities (Live trade data)
actions (User intent, e.g., "Register", "Contact")
3. Usage
Use 
useSearchRegistry()
 to access the filtered, grouped data.
Use 
SearchContext
 to control the visibility of the global palette.
