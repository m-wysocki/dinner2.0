import type { CanonicalUnit, InterfaceLanguage } from '@dinner/shared';

export type TranslationParams = Record<string, string | number>;

const pl = {
  'app.loading': 'Ładowanie dinner2...',
  'app.retry': 'Spróbuj ponownie',
  'app.back': 'Wróć',
  'app.backToHome': 'Wróć do ekranu głównego',
  'app.backToHomeScreen': 'Wróć do strony głównej',
  'app.cancel': 'Anuluj',
  'app.logout': 'Wyloguj się',
  'app.subtitle': 'Menedżer przepisów',

  'home.connecting': 'Łączenie z API...',
  'home.connectFailed': 'Nie udało się połączyć z API.',
  'home.apiWorking': 'API działa prawidłowo',
  'home.connected': 'Połączenie zostało ustanowione.',
  'home.collection': 'Twoja kolekcja',
  'home.loadingRecipes': 'Ładowanie przepisów...',
  'home.loadRecipesFailed': 'Nie udało się pobrać przepisów.',
  'home.emptyTitle': 'Nie masz jeszcze przepisów',
  'home.emptyMessage': 'Dodaj pierwszy przepis do swojej kolekcji.',
  'home.addRecipe': 'Dodaj przepis',
  'home.accessPending': 'Dostęp oczekuje na aktywację',
  'home.checkAccount': 'Sprawdź status konta',
  'home.login': 'Zaloguj się',
  'home.noAccount': 'Nie masz konta? Zarejestruj się.',

  'servings.one': 'porcja',
  'servings.few': 'porcje',
  'servings.many': 'porcji',

  'user.titlePending': 'Oczekiwanie na aktywację',
  'user.messagePending':
    'Twoje konto zostało potwierdzone, ale administrator nie aktywował jeszcze dostępu. Otrzymasz dostęp do prywatnych przepisów po aktywacji konta.',
  'user.titleActive': 'Zalogowano',
  'user.messageActive':
    'Jesteś zalogowany i możesz zarządzać swoimi przepisami.',
  'user.language': 'Język interfejsu',

  'language.title': 'Język interfejsu',
  'language.message': 'Wybierz język interfejsu aplikacji.',
  'language.polish': 'Polski',
  'language.english': 'Angielski',
  'language.current': 'Obecny',
  'language.saveFailed': 'Nie udało się zapisać języka.',

  'login.title': 'Logowanie',
  'login.subtitle': 'Wpisz dane konta, aby zarządzać swoimi przepisami.',
  'login.emailPlaceholder': 'Adres e-mail',
  'login.passwordPlaceholder': 'Hasło',
  'login.submit': 'Zaloguj się',
  'login.noAccount': 'Nie masz jeszcze konta? Zarejestruj się.',

  'register.title': 'Załóż konto',
  'register.subtitle': 'Zarejestruj się, aby zarządzać swoimi przepisami.',
  'register.successTitle': 'Konto utworzone',
  'register.successMessage':
    'Sprawdź swoją skrzynkę e-mail i kliknij link potwierdzający w wiadomości od nas. Po potwierdzeniu adresu Twoje konto będzie oczekiwać na aktywację przez administratora.',
  'register.emailPlaceholder': 'Adres e-mail',
  'register.passwordPlaceholder': 'Hasło',
  'register.submit': 'Zarejestruj się',

  'confirm.title': 'Potwierdzenie adresu e-mail',
  'confirm.checking': 'Sprawdzanie linku...',
  'confirm.success': 'Adres e-mail został potwierdzony.',
  'confirm.successMessage':
    'Możesz teraz zalogować się do swojego konta. Dostęp do przepisów zostanie włączony po aktywacji przez administratora.',
  'confirm.noLink': 'Nie znaleziono linku potwierdzającego.',
  'confirm.invalidLink': 'Link potwierdzający jest nieprawidłowy.',

  'create.title': 'Nowy przepis',
  'create.savedTitle': 'Przepis zapisany',
  'create.savedMessage':
    'Przepis na {servings} został dodany do Twojej kolekcji.',
  'create.submit': 'Zapisz przepis',

  'details.notFound': 'Nie znaleziono przepisu.',
  'details.loadFailed': 'Nie udało się pobrać przepisu.',
  'details.edit': 'Edytuj',
  'details.ingredients': 'Składniki',
  'details.noIngredients': 'Brak składników.',
  'details.preparation': 'Przygotowanie',
  'details.noSteps': 'Brak kroków przygotowania.',
  'details.deleteFailed': 'Nie udało się usunąć przepisu.',
  'details.deleteQuestion': 'Usunąć przepis?',
  'details.deleteWarning':
    'Przepis zostanie trwale usunięty wraz ze składnikami i krokami.',
  'details.deleting': 'Usuwanie...',
  'details.delete': 'Usuń',
  'details.deleteRecipe': 'Usuń przepis',

  'edit.title': 'Edytuj przepis',
  'edit.submit': 'Zapisz zmiany',

  'form.title': 'Tytuł',
  'form.titlePlaceholder': 'Np. Zupa pomidorowa',
  'form.description': 'Opis (opcjonalnie)',
  'form.descriptionPlaceholder': 'Kilka słów o przepisie',
  'form.servingCount': 'Liczba porcji',
  'form.servingCountPlaceholder': 'Np. 4',
  'form.ingredients': 'Składniki',
  'form.ingredientName': 'Nazwa składnika',
  'form.ingredientNameA11y': 'Nazwa składnika {number}',
  'form.ingredientQuantityA11y': 'Ilość składnika {number}',
  'form.quantityPlaceholder': 'Ilość, np. 2 (opcjonalnie)',
  'form.ingredientNoteA11y': 'Notatka składnika {number}',
  'form.notePlaceholder': 'Notatka (opcjonalnie)',
  'form.moveUp': 'W górę',
  'form.moveDown': 'W dół',
  'form.removeIngredient': 'Usuń składnik',
  'form.addIngredient': 'Dodaj składnik',
  'form.customIngredientA11y': 'Nazwa własnego składnika',
  'form.customIngredientPlaceholder': 'Nowy własny składnik',
  'form.createCustomIngredient': 'Utwórz własny składnik',
  'form.preparation': 'Przygotowanie',
  'form.stepA11y': 'Krok przygotowania {number}',
  'form.stepPlaceholder': 'Opisz krok przygotowania',
  'form.removeStep': 'Usuń krok',
  'form.addStep': 'Dodaj krok',
  'form.errorIdentity':
    'Wybierz kanoniczny składnik z katalogu dla każdej pozycji.',
  'form.errorQuantity':
    'Podaj ilość jako liczbę, maksymalnie z sześcioma miejscami po przecinku, albo zostaw ją pustą.',
  'form.errorStep': 'Każdy krok przygotowania musi zawierać treść.',
  'form.errorBasics': 'Podaj tytuł i prawidłową liczbę porcji.',
  'form.saveFailed': 'Nie udało się zapisać przepisu.',
  'form.addIngredientFailed': 'Nie udało się dodać składnika.',

  'auth.invalidForm': 'Podaj poprawny adres e-mail i hasło (minimum 8 znaków).',
  'auth.unexpectedError': 'Wystąpił nieoczekiwany błąd.',

  'api.sessionExpired': 'Sesja wygasła. Zaloguj się ponownie.',
  'api.networkError': 'Nie można połączyć się z API.',
  'api.httpError': 'API zwróciło błąd ({status}).',
  'api.invalidResponse': 'API zwróciło nieprawidłową odpowiedź.',

  'unit.G': 'g',
  'unit.KG': 'kg',
  'unit.ML': 'ml',
  'unit.L': 'l',
  'unit.PCS': 'szt.',
  'unit.TSP': 'łyżeczka',
  'unit.TBSP': 'łyżka',
  'unit.OTHER': '',
} as const;

export type TranslationKey = keyof typeof pl;

const en: Record<TranslationKey, string> = {
  'app.loading': 'Loading dinner2...',
  'app.retry': 'Try again',
  'app.back': 'Back',
  'app.backToHome': 'Back to home',
  'app.backToHomeScreen': 'Back to home',
  'app.cancel': 'Cancel',
  'app.logout': 'Log out',
  'app.subtitle': 'Recipe manager',

  'home.connecting': 'Connecting to the API...',
  'home.connectFailed': 'Could not connect to the API.',
  'home.apiWorking': 'API is working correctly',
  'home.connected': 'Connection established.',
  'home.collection': 'Your collection',
  'home.loadingRecipes': 'Loading recipes...',
  'home.loadRecipesFailed': 'Could not load recipes.',
  'home.emptyTitle': 'You have no recipes yet',
  'home.emptyMessage': 'Add your first recipe to your collection.',
  'home.addRecipe': 'Add recipe',
  'home.accessPending': 'Access is pending activation',
  'home.checkAccount': 'Check account status',
  'home.login': 'Log in',
  'home.noAccount': "Don't have an account? Register.",

  'servings.one': 'serving',
  'servings.few': 'servings',
  'servings.many': 'servings',

  'user.titlePending': 'Waiting for activation',
  'user.messagePending':
    'Your account has been confirmed, but an administrator has not activated access yet. You will get access to your private recipes once your account is activated.',
  'user.titleActive': 'Logged in',
  'user.messageActive': 'You are logged in and can manage your recipes.',
  'user.language': 'Interface language',

  'language.title': 'Interface language',
  'language.message': 'Choose the app interface language.',
  'language.polish': 'Polish',
  'language.english': 'English',
  'language.current': 'Current',
  'language.saveFailed': 'Could not save the language.',

  'login.title': 'Log in',
  'login.subtitle': 'Enter your account details to manage your recipes.',
  'login.emailPlaceholder': 'Email address',
  'login.passwordPlaceholder': 'Password',
  'login.submit': 'Log in',
  'login.noAccount': "Don't have an account yet? Register.",

  'register.title': 'Create account',
  'register.subtitle': 'Register to manage your recipes.',
  'register.successTitle': 'Account created',
  'register.successMessage':
    'Check your inbox and click the confirmation link in our message. After confirming your address, your account will wait for activation by an administrator.',
  'register.emailPlaceholder': 'Email address',
  'register.passwordPlaceholder': 'Password',
  'register.submit': 'Register',

  'confirm.title': 'Email confirmation',
  'confirm.checking': 'Checking the link...',
  'confirm.success': 'Email address confirmed.',
  'confirm.successMessage':
    'You can now log in to your account. Recipe access will be enabled after activation by an administrator.',
  'confirm.noLink': 'No confirmation link found.',
  'confirm.invalidLink': 'The confirmation link is invalid.',

  'create.title': 'New recipe',
  'create.savedTitle': 'Recipe saved',
  'create.savedMessage':
    'The recipe for {servings} was added to your collection.',
  'create.submit': 'Save recipe',

  'details.notFound': 'Recipe not found.',
  'details.loadFailed': 'Could not load the recipe.',
  'details.edit': 'Edit',
  'details.ingredients': 'Ingredients',
  'details.noIngredients': 'No ingredients.',
  'details.preparation': 'Preparation',
  'details.noSteps': 'No preparation steps.',
  'details.deleteFailed': 'Could not delete the recipe.',
  'details.deleteQuestion': 'Delete recipe?',
  'details.deleteWarning':
    'The recipe will be permanently deleted along with its ingredients and steps.',
  'details.deleting': 'Deleting...',
  'details.delete': 'Delete',
  'details.deleteRecipe': 'Delete recipe',

  'edit.title': 'Edit recipe',
  'edit.submit': 'Save changes',

  'form.title': 'Title',
  'form.titlePlaceholder': 'e.g. Tomato soup',
  'form.description': 'Description (optional)',
  'form.descriptionPlaceholder': 'A few words about the recipe',
  'form.servingCount': 'Number of servings',
  'form.servingCountPlaceholder': 'e.g. 4',
  'form.ingredients': 'Ingredients',
  'form.ingredientName': 'Ingredient name',
  'form.ingredientNameA11y': 'Ingredient name {number}',
  'form.ingredientQuantityA11y': 'Ingredient quantity {number}',
  'form.quantityPlaceholder': 'Quantity, e.g. 2 (optional)',
  'form.ingredientNoteA11y': 'Ingredient note {number}',
  'form.notePlaceholder': 'Note (optional)',
  'form.moveUp': 'Move up',
  'form.moveDown': 'Move down',
  'form.removeIngredient': 'Remove ingredient',
  'form.addIngredient': 'Add ingredient',
  'form.customIngredientA11y': 'Custom ingredient name',
  'form.customIngredientPlaceholder': 'New custom ingredient',
  'form.createCustomIngredient': 'Create custom ingredient',
  'form.preparation': 'Preparation',
  'form.stepA11y': 'Preparation step {number}',
  'form.stepPlaceholder': 'Describe the preparation step',
  'form.removeStep': 'Remove step',
  'form.addStep': 'Add step',
  'form.errorIdentity':
    'Choose a canonical ingredient from the catalog for every entry.',
  'form.errorQuantity':
    'Enter the quantity as a number, up to six decimal places, or leave it empty.',
  'form.errorStep': 'Every preparation step must have text.',
  'form.errorBasics': 'Enter a title and a valid number of servings.',
  'form.saveFailed': 'Could not save the recipe.',
  'form.addIngredientFailed': 'Could not add the ingredient.',

  'auth.invalidForm':
    'Enter a valid email address and password (at least 8 characters).',
  'auth.unexpectedError': 'An unexpected error occurred.',

  'api.sessionExpired': 'Your session has expired. Please log in again.',
  'api.networkError': 'Could not connect to the API.',
  'api.httpError': 'The API returned an error ({status}).',
  'api.invalidResponse': 'The API returned an invalid response.',

  'unit.G': 'g',
  'unit.KG': 'kg',
  'unit.ML': 'ml',
  'unit.L': 'l',
  'unit.PCS': 'pcs',
  'unit.TSP': 'tsp',
  'unit.TBSP': 'tbsp',
  'unit.OTHER': '',
};

export const translations: Record<
  InterfaceLanguage,
  Record<TranslationKey, string>
> = { pl, en };

export function translate(
  key: TranslationKey,
  params?: TranslationParams,
  language: InterfaceLanguage = 'pl',
): string {
  let text = translations[language][key];

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }

  return text;
}

export function formatServings(
  count: number,
  language: InterfaceLanguage,
): string {
  const dict = translations[language];

  if (language === 'en') {
    return `${count} ${count === 1 ? dict['servings.one'] : dict['servings.many']}`;
  }

  const mod10 = count % 10;
  const mod100 = count % 100;

  let form: 'one' | 'few' | 'many' = 'many';

  if (count === 1) {
    form = 'one';
  } else if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    form = 'few';
  }

  return `${count} ${dict[`servings.${form}`]}`;
}

export function unitLabel(
  unit: CanonicalUnit,
  language: InterfaceLanguage,
): string {
  return translations[language][`unit.${unit}`];
}
