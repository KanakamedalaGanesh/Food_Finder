/* ==== Elements ==== */
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

/* ==== State ==== */
let CATEGORIES = [];
let CATEGORY_MAP = {};

/* ==== API ==== */
const api = {
  categories: 'https://www.themealdb.com/api/json/v1/1/categories.php',
  search: q => `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
  filterByCat: c => `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(c)}`,
  details: id => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
};

/* ==== View Control ==== */
function setView(mode){
  detailsSection.classList.add('hidden');
  categoryAbout.classList.add('hidden');
  mealsSection.classList.add('hidden');
  categoriesSection.classList.add('hidden');

  if(mode==='home'){ categoriesSection.classList.remove('hidden'); }
  if(mode==='category'){
    categoryAbout.classList.remove('hidden');
    mealsSection.classList.remove('hidden');
    categoriesSection.classList.remove('hidden');
  }
  if(mode==='details'){ detailsSection.classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }
}

/* ==== Drawer ==== */
hamburger.addEventListener('click', ()=>{ drawer.classList.add('open'); backdrop.classList.add('show'); });
drawerClose.addEventListener('click', ()=>{ drawer.classList.remove('open'); backdrop.classList.remove('show'); });
backdrop.addEventListener('click', ()=>{ drawer.classList.remove('open'); backdrop.classList.remove('show'); });

/* ==== Search ==== */
searchBtn.addEventListener('click', ()=>doSearch());
searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter') doSearch(); });

async function doSearch(){
  const q = searchInput.value.trim();
  if(!q){ setView('home'); return; }
  const res = await fetch(api.search(q));
  const data = await res.json();
  const meals = data.meals || [];
  mealsHeading.textContent = 'Meals';
  renderMeals(meals);
  setView('category');
}

/* ==== Categories ==== */
async function loadCategories(){
  const res = await fetch(api.categories);
  const { categories } = await res.json();
  CATEGORIES = categories;
  CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.strCategory,c]));

  drawerList.innerHTML = CATEGORIES.map(c=>`<li data-cat="${c.strCategory}">${c.strCategory}</li>`).join('');
  categoriesGrid.innerHTML = CATEGORIES.map(c=>`
    <article class="card" data-cat="${c.strCategory}">
      <img src="${c.strCategoryThumb}" alt="${c.strCategory}">
      <div class="card-body">
        <span class="badge">${c.strCategory.toUpperCase()}</span>
      </div>
    </article>`).join('');
}
categoriesGrid.addEventListener('click', e=>{
  const card = e.target.closest('[data-cat]'); if(!card) return;
  loadMealsByCategory(card.dataset.cat);
});
drawerList.addEventListener('click', e=>{
  const li = e.target.closest('li[data-cat]'); if(!li) return;
  drawer.classList.remove('open'); backdrop.classList.remove('show');
  loadMealsByCategory(li.dataset.cat);
});

async function loadMealsByCategory(name){
  const cat = CATEGORY_MAP[name];
  aboutTitle.textContent = cat.strCategory;
  aboutText.textContent = cat.strCategoryDescription;

  const res = await fetch(api.filterByCat(name));
  const data = await res.json();
  const meals = data.meals || [];
  mealsHeading.textContent = 'Meals';
  renderMeals(meals,name);
  setView('category');
}

/* ==== Meals ==== */
function renderMeals(meals,catName){
  mealsGrid.innerHTML = meals.map(m=>`
    <article class="card" data-id="${m.idMeal}">
      <img src="${m.strMealThumb}" alt="${m.strMeal}">
      <div class="card-body">
        ${catName?`<span class="badge">${catName}</span>`:''}
        <div class="card-title">${m.strMeal}</div>
      </div>
    </article>`).join('');
  if(!meals.length) mealsGrid.innerHTML = `<p>No meals found.</p>`;
}
mealsGrid.addEventListener('click', e=>{
  const card = e.target.closest('[data-id]'); if(!card) return;
  showMealDetails(card.dataset.id);
});

/* ==== Meal Details ==== */
async function showMealDetails(id){
  const res = await fetch(api.details(id));
  const data = await res.json();
  const meal = data.meals && data.meals[0]; if(!meal) return;

  breadcrumb.textContent = meal.strMeal;
  detailsImg.src = meal.strMealThumb;
  detailsCategory.textContent = meal.strCategory||'-';

  if(meal.strSource && meal.strSource.startsWith("http")){
    detailsSource.textContent = new URL(meal.strSource).hostname;
    detailsSource.href = meal.strSource;
  }else{ detailsSource.textContent='—'; detailsSource.removeAttribute('href'); }

  detailsTags.innerHTML='';
  if(meal.strTags){ meal.strTags.split(',').forEach(t=>{
    const span=document.createElement('span'); span.className='tag'; span.textContent=t.trim();
    detailsTags.appendChild(span);
  }); }

  ingredientsList.innerHTML=''; measureList.innerHTML='';
  for(let i=1;i<=20;i++){
    const ing=meal[`strIngredient${i}`], meas=meal[`strMeasure${i}`];
    if(ing && ing.trim()){
      const liI=document.createElement('li'); liI.textContent=ing; ingredientsList.appendChild(liI);
      const liM=document.createElement('li'); liM.textContent=(meas||'').trim(); measureList.appendChild(liM);
    }
  }

  const steps=(meal.strInstructions||'').split(/\n+/).filter(Boolean);
  instructionsList.innerHTML=steps.map(s=>`<li>${s}</li>`).join('');

  setView('details');
}

/* ==== Init ==== */
loadCategories();
setView('home');
