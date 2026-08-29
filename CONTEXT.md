# Recipe Manager

This context describes the language of a private, multi-user recipe management application. It focuses on recipes a user collects and maintains for personal cooking.

## People and ownership

**User**:
A person with an account who owns private recipes and their related data.
_Avoid_: Account, customer, client

**Recipe collection**:
The set of recipes owned by one user.
_Avoid_: Cookbook, catalog

## Recipes

**Recipe**:
A structured cooking instruction owned by a user, containing its descriptive information, ingredients, and preparation steps.
_Avoid_: Dish, meal

**Ingredient**:
A structured component of a recipe with a name, quantity, unit, and position in the ingredient list.
_Avoid_: Ingredient string, item

**Canonical unit**:
The language-independent unit identity used for an ingredient quantity, regardless of how that unit is displayed to the user.
_Avoid_: Unit label, localized unit

**Preparation step**:
One ordered instruction describing part of a recipe's preparation.
_Avoid_: Instruction, recipe step text

**Manual recipe creation**:
The workflow in which a user enters recipe information directly instead of importing it from another source.
_Avoid_: Recipe import, recipe scan

**AI-assisted recipe creation**:
The workflow in which a user pastes a complete recipe as text and an AI service extracts the structured recipe, subject to user review before saving. The extracted content remains in the language of the pasted text and is never translated.
_Avoid_: AI import, automated recipe entry

**Recipe source text**:
The unprocessed text a user pastes when creating a recipe through AI-assisted creation; it is retained with the recipe for provenance but is not displayed as recipe content.
_Avoid_: Description, raw description, paste field

**Serving count**:
The number of portions represented by a recipe's ingredient quantities.
_Avoid_: Portions, yield

**Optional ingredient quantity**:
An ingredient quantity that is intentionally absent because the recipe uses an expression such as "to taste" rather than a measurable amount.
_Avoid_: Zero quantity, unknown quantity

## Product boundaries

**First vertical slice**:
The initial product workflow: authentication, manual recipe creation, persistence, collection listing, recipe details, and editing.
_Avoid_: Full MVP, Phase 1

**Interface language**:
The language used for the application's own labels, messages, and navigation; the first supported languages are Polish and English, with Polish as the default.
_Avoid_: Recipe language, content language

**Platform support**:
The application must work on iOS, Android, and the web. Web support is a required product surface, not an optional development or fallback mode.
_Avoid_: Mobile-only implementation

**Imported recipe**:
A recipe created from external input that retains its source information and may have a normalized representation in the user's interface language.
_Avoid_: Scraped recipe, translated recipe

**Canonical ingredient identity**:
The language-independent identity used to recognize equivalent ingredients across recipes and languages.
_Avoid_: Display name, translated ingredient name

For a saved recipe, every ingredient must have a canonical identity confirmed by the user. When automatic recognition is uncertain, the user chooses or corrects it before saving.

**Ingredient catalog**:
The set of canonical ingredient identities used to recognize and merge equivalent ingredients across a user's recipes.
_Avoid_: Ingredient list, translation dictionary

**Custom ingredient**:
An ingredient identity added when the existing catalog does not contain a suitable match.
_Avoid_: Unknown ingredient, free-form ingredient

**Recipe ingredient**:
An ingredient occurrence belonging to one recipe, linked to a canonical ingredient identity while retaining the name and quantity used in that recipe.
_Avoid_: Catalog ingredient, ingredient template
