// Grab elements
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('backdrop');
const hamburger = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');
const drawerList = document.getElementById('drawerList');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

const categoriesGrid = document.getElementById('categoriesGrid');
const mealsGrid = document.getElementById('mealsGrid');
const mealsSection = document.getElementById('mealsSection');
const mealsHeading = document.getElementById('mealsHeading');
const categoriesSection = document.getElementById('categoriesSection');

const categoryAbout = document.getElementById('categoryAbout');
const aboutTitle = document.getElementById('aboutTitle');
const aboutText = document.getElementById('aboutText');

const detailsSection = document.getElementById('mealDetails');
const breadcrumb = document.getElementById('breadcrumb');
const detailsImg = document.getElementById('detailsImg');
const detailsCategory = document.getElementById('detailsCategory');
const detailsSource = document.getElementById('detailsSource');
const detailsTags = document.getElementById('detailsTags');
const ingredientsList = document.getElementById('ingredientsList');
const measureList = document.getElementById('measureList');
const instructionsList = document.getElementById('instructionsList');

// Store categories
let allCategories = [];
let categoryInfo = {};

// API links
const api = {
  categories: 'https://www.themealdb.com/api/json/v1/1/categories.php',
  search: q => `https://www.themealdb.com/api/json/v1/1/search.php?s=${q}`,
  byCategory: c => `https://www.themealdb.com/api/json/v1/1/filter.php?c=${c}`,
  details: id => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
};

// Switch sections
function showView(type) {
  detailsSection.classList.add('hidden');
  categoryAbout.classList.add('hidden');
  mealsSection.classList.add('hidden');
  categoriesSection.classList.add('hidden');

  if (type === 'home') categoriesSection.classList.remove('hidden');
  if (type === 'category') {
    categoryAbout.classList.remove('hidden');
    mealsSection.classList.remove('hidden');
    categoriesSection.classList.remove('hidden');
  }
  if (type === 'details') {
    detailsSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Drawer open/close
hamburger.addEventListener('click', () => {
  drawer.classList.add('open');
  backdrop.classList.add('show');
});
drawerClose.addEventListener('click', () => {
  drawer.classList.remove('open');
  backdrop.classList.remove('show');
});
backdrop.addEventListener('click', () => {
  drawer.classList.remove('open');
  backdrop.classList.remove('show');
});

// Search meals
searchBtn.addEventListener('click', searchMeals);
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchMeals();
});

async function searchMeals() {
  const query = searchInput.value.trim();
  if (!query) {
    showView('home');
    return;
  }
  const res = await fetch(api.search(query));
  const data = await res.json();
  const meals = data.meals || [];

  mealsHeading.textContent = "Meals";
  displayMeals(meals);
  showView('category');
}

// Load categories
async function loadCategories() {
  const res = await fetch(api.categories);
  const data = await res.json();
  allCategories = data.categories;

  // Save category details
  allCategories.forEach(c => categoryInfo[c.strCategory] = c);

  // Drawer list
  drawerList.innerHTML = allCategories.map(c =>
    `<li data-cat="${c.strCategory}">${c.strCategory}</li>`
  ).join('');

  // Cards grid
  categoriesGrid.innerHTML = allCategories.map(c => `
    <article class="card" data-cat="${c.strCategory}">
      <img src="${c.strCategoryThumb}" alt="${c.strCategory}">
      <div class="card-body">
        <span class="badge">${c.strCategory.toUpperCase()}</span>
      </div>
    </article>
  `).join('');
}

categoriesGrid.addEventListener('click', e => {
  const card = e.target.closest('[data-cat]');
  if (!card) return;
  loadMeals(card.dataset.cat);
});

drawerList.addEventListener('click', e => {
  const li = e.target.closest('li[data-cat]');
  if (!li) return;
  drawer.classList.remove('open');
  backdrop.classList.remove('show');
  loadMeals(li.dataset.cat);
});

// Load meals of a category
async function loadMeals(catName) {
  const cat = categoryInfo[catName];
  aboutTitle.textContent = cat.strCategory;
  aboutText.textContent = cat.strCategoryDescription;

  const res = await fetch(api.byCategory(catName));
  const data = await res.json();
  const meals = data.meals || [];

  mealsHeading.textContent = "Meals";
  displayMeals(meals, catName);
  showView('category');
}

// Show meals on screen
function displayMeals(meals, catName) {
  if (!meals.length) {
    mealsGrid.innerHTML = "<p>No meals found.</p>";
    return;
  }

  mealsGrid.innerHTML = meals.map(m => `
    <article class="card" data-id="${m.idMeal}">
      <img src="${m.strMealThumb}" alt="${m.strMeal}">
      <div class="card-body">
        ${catName ? `<span class="badge">${catName}</span>` : ""}
        <div class="card-title">${m.strMeal}</div>
      </div>
    </article>
  `).join('');
}

mealsGrid.addEventListener('click', e => {
  const card = e.target.closest('[data-id]');
  if (!card) return;
  showMeal(card.dataset.id);
});

// Show details of one meal
async function showMeal(id) {
  const res = await fetch(api.details(id));
  const data = await res.json();
  const meal = data.meals && data.meals[0];
  if (!meal) return;

  breadcrumb.textContent = meal.strMeal;
  detailsImg.src = meal.strMealThumb;
  detailsCategory.textContent = meal.strCategory || "-";

  // Source link
  if (meal.strSource && meal.strSource.startsWith("http")) {
    detailsSource.textContent = new URL(meal.strSource).hostname;
    detailsSource.href = meal.strSource;
  } else {
    detailsSource.textContent = "—";
    detailsSource.removeAttribute("href");
  }

  // Tags
  detailsTags.innerHTML = "";
  if (meal.strTags) {
    meal.strTags.split(",").forEach(tag => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag.trim();
      detailsTags.appendChild(span);
    });
  }

  // Ingredients + measures
  ingredientsList.innerHTML = "";
  measureList.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      const li1 = document.createElement("li");
      li1.textContent = ing;
      ingredientsList.appendChild(li1);

      const li2 = document.createElement("li");
      li2.textContent = (meas || "").trim();
      measureList.appendChild(li2);
    }
  }

  // Instructions
  instructionsList.innerHTML = "";
  (meal.strInstructions || "").split("\n").forEach(step => {
    if (step.trim()) {
      const li = document.createElement("li");
      li.textContent = step;
      instructionsList.appendChild(li);
    }
  });

  showView('details');
}

// Start
loadCategories();
showView('home');
