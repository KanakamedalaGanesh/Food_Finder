/* ===== ELEMENTS ===== */
const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('backdrop');
const hamburger = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');
const drawerList = document.getElementById('drawerList');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

const categoriesGrid = document.getElementById('categoriesGrid');
const mealsGrid = document.getElementById('mealsGrid');

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

/* ===== STATE ===== */
let CATEGORIES = [];        // full category data with descriptions
let CATEGORY_MAP = {};      // quick lookup by name

/* ===== HELPERS ===== */
const api = {
  categories: 'https://www.themealdb.com/api/json/v1/1/categories.php',
  search: (q) => `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
  filterByCat: (c) => `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c)}`,
  details: (id) => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`
};

const openDrawer = () => { drawer.classList.add('open'); backdrop.classList.add('show'); }
const closeDrawer = () => { drawer.classList.remove('open'); backdrop.classList.remove('show'); }

/* ===== UI WIRES ===== */
hamburger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);

searchBtn.addEventListener('click', () => doSearch());
searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ doSearch(); }});

/* Delegate clicks inside mealsGrid so cards always work */
mealsGrid.addEventListener('click', (e) => {
  const card = e.target.closest('[data-id]');
  if (!card) return;
  const id = card.getAttribute('data-id');
  showMealDetails(id);
  window.scrollTo({ top: detailsSection.offsetTop - 10, behavior: 'smooth' });
});

/* Delegate clicks in categoriesGrid */
categoriesGrid.addEventListener('click', (e) => {
  const cat = e.target.closest('[data-cat]');
  if (!cat) return;
  const name = cat.getAttribute('data-cat');
  loadMealsByCategory(name);
  window.scrollTo({ top: document.querySelector('.section').offsetTop - 10, behavior: 'smooth' });
});

/* Drawer category click */
drawerList.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-cat]');
  if (!li) return;
  closeDrawer();
  const name = li.getAttribute('data-cat');
  loadMealsByCategory(name);
  window.scrollTo({ top: document.querySelector('.section').offsetTop - 10, behavior: 'smooth' });
});

/* ===== LOAD CATEGORIES ===== */
async function loadCategories(){
  const res = await fetch(api.categories);
  const { categories } = await res.json();
  CATEGORIES = categories || [];
  CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.strCategory, c]));

  // Drawer list
  drawerList.innerHTML = CATEGORIES.map(c => `<li data-cat="${c.strCategory}">${c.strCategory}</li>`).join('');

  // Grid
  categoriesGrid.innerHTML = CATEGORIES.map(c => `
    <article class="card" data-cat="${c.strCategory}" title="${c.strCategory}">
      <img src="${c.strCategoryThumb}" alt="${c.strCategory}">
      <div class="card-body">
        <span class="badge">${c.strCategory.toUpperCase()}</span>
      </div>
    </article>
  `).join('');
}

/* ===== SEARCH ===== */
async function doSearch(){
  const q = searchInput.value.trim();
  categoryAbout.classList.add('hidden'); // Hide category about when searching
  if(!q){ mealsGrid.innerHTML = ''; return; }

  const res = await fetch(api.search(q));
  const data = await res.json();
  const meals = data.meals || [];
  renderMeals(meals);
}

/* ===== FILTER BY CATEGORY ===== */
async function loadMealsByCategory(categoryName){
  // Show description box
  const cat = CATEGORY_MAP[categoryName];
  if (cat){
    aboutTitle.textContent = cat.strCategory;
    aboutText.textContent = cat.strCategoryDescription;
    categoryAbout.classList.remove('hidden');
  }else{
    categoryAbout.classList.add('hidden');
  }

  const res = await fetch(api.filterByCat(categoryName));
  const data = await res.json();
  const meals = data.meals || [];
  renderMeals(meals, categoryName);
}

/* ===== RENDER MEAL CARDS ===== */
function renderMeals(meals, catName){
  detailsSection.classList.add('hidden'); // hide details when listing
  mealsGrid.innerHTML = meals.map(m => `
    <article class="card" data-id="${m.idMeal}" title="${m.strMeal}">
      <img src="${m.strMealThumb}" alt="${m.strMeal}">
      <div class="card-body">
        ${catName ? `<span class="badge">${catName}</span>` : ''}
        <div class="card-title">${m.strMeal}</div>
      </div>
    </article>
  `).join('');

  if(meals.length === 0){
    mealsGrid.innerHTML = `<p style="color:#666">No meals found.</p>`;
  }
}

/* ===== MEAL DETAILS ===== */
async function showMealDetails(id){
  const res = await fetch(api.details(id));
  const data = await res.json();
  const meal = data.meals && data.meals[0];
  if(!meal) return;

  // Breadcrumb (like screenshot title bar)
  breadcrumb.textContent = `▶ ${meal.strMeal}`;

  // Basic meta
  detailsImg.src = meal.strMealThumb;
  detailsImg.alt = meal.strMeal;
  detailsCategory.textContent = meal.strCategory || '-';
  detailsSource.textContent = meal.strSource ? new URL(meal.strSource).hostname : '—';
  detailsSource.href = meal.strSource || '#';

  // Tags
  detailsTags.innerHTML = '';
  if (meal.strTags){
    meal.strTags.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>{
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      detailsTags.appendChild(span);
    });
  }

  // Ingredients + measures (1..20)
  ingredientsList.innerHTML = '';
  measureList.innerHTML = '';
  for (let i=1; i<=20; i++){
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if(ing && ing.trim()){
      const liI = document.createElement('li');
      liI.textContent = `${ing}`;
      ingredientsList.appendChild(liI);

      const liM = document.createElement('li');
      liM.textContent = `${meas || ''}`.trim();
      measureList.appendChild(liM);
    }
  }

  // Instructions -> split into steps
  const steps = (meal.strInstructions || '')
    .replace(/\r/g,'')
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  instructionsList.innerHTML = steps.map(s => `<li>${s}</li>`).join('');

  detailsSection.classList.remove('hidden');
}

/* ===== INIT ===== */
loadCategories();
