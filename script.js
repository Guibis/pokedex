const pokedexGrid = document.getElementById('pokedex-grid');
const searchInput = document.getElementById('search-input');
const carouselContainer = document.getElementById('pokedex-carousel');
const gridContainer = document.getElementById('pokedex-grid');
const carouselTrack = document.getElementById('carousel-track');
const viewToggleBtn = document.getElementById('view-toggle');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const searchContainer = document.getElementById('search-container');
const modal = document.getElementById('pokemon-detail-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

let allPokemon = [];
let currentIndex = 0;
let isGridView = false;
const pokemonCache = {};

async function getPokemonDetails(index) {
    if (index < 0 || index >= allPokemon.length) return null;
    if (pokemonCache[index]) return pokemonCache[index];

    try {
        const response = await fetch(allPokemon[index].url);
        const data = await response.json();
        pokemonCache[index] = data;
        return data;
    } catch (e) {
        return null;
    }
}

async function updateCarousel() {
    carouselTrack.innerHTML = '';
    const indicesToShow = [currentIndex - 1, currentIndex, currentIndex + 1];
    
    for (let i = 0; i < indicesToShow.length; i++) {
        const idx = indicesToShow[i];
        
        const slide = document.createElement('div');
        slide.classList.add('pokemon-slide');
        
        if (idx === currentIndex) slide.classList.add('active');
        if (idx === currentIndex - 1) slide.classList.add('prev');
        if (idx === currentIndex + 1) slide.classList.add('next');

        if (idx >= 0 && idx < allPokemon.length) {
            const details = await getPokemonDetails(idx);
            
            if (details) {
                const img = document.createElement('img');
                img.src = details.sprites.front_default;
                img.alt = details.name;
                
                const info = document.createElement('div');
                info.classList.add('slide-info');
                
                const name = document.createElement('h2');
                name.classList.add('slide-name');
                name.textContent = details.name;
                
                slide.addEventListener('click', () => {
                    if (idx === currentIndex) {
                       fetchPokemonDetails(allPokemon[idx].url);
                    } else {
                       currentIndex = idx;
                       updateCarousel();
                    }
                });

                info.appendChild(name);
                slide.appendChild(img);
                slide.appendChild(info);
                
                if (idx === currentIndex && !isGridView) {
                    updateTheme(details.types[0].type.name);
                }
            }
        } else {
            slide.style.visibility = 'hidden';
        }
        
        carouselTrack.appendChild(slide);
    }
    
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === allPokemon.length - 1;
    prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
    nextBtn.style.opacity = currentIndex === allPokemon.length - 1 ? '0.3' : '1';
}

function updateTheme(type) {
    const colorVar = `var(--type-${type}, #777)`;
    document.body.style.background = colorVar;
}

function renderPokemon(pokemonList) {
    pokedexGrid.innerHTML = '';
    
    if (pokemonList.length === 0) {
        pokedexGrid.innerHTML = '<p class="no-results">No Pokemon found.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    pokemonList.forEach(pokemon => {
        const pokemonId = pokemon.id;
        const pokemonName = pokemon.name;
        
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        card.dataset.url = pokemon.url;
        
        const numberDisplay = document.createElement('span');
        numberDisplay.classList.add('pokemon-number');
        numberDisplay.textContent = `#${pokemonId.toString().padStart(3, '0')}`;
        
        const nameDisplay = document.createElement('h3');
        nameDisplay.classList.add('pokemon-name');
        nameDisplay.textContent = pokemonName;
        
        card.appendChild(numberDisplay);
        card.appendChild(nameDisplay);
        
        fragment.appendChild(card);
    });

    pokedexGrid.appendChild(fragment);
}

async function fetchPokemonDetails(url) {
    try {
        modalBody.innerHTML = '<div class="loading">Loading Pokemon Data...</div>';
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        renderDetailView(data);
    } catch (error) {
        modalBody.innerHTML = '<p class="error-msg">Failed to load details.</p>';
    }
}

function renderDetailView(pokemon) {
    const typesHtml = pokemon.types.map(typeInfo => {
        const typeName = typeInfo.type.name;
        return `<span class="type-badge" style="background-color: var(--type-${typeName}, #777);">${typeName}</span>`;
    }).join('');

    const statsHtml = pokemon.stats.map(stat => {
        const statName = stat.stat.name.replace('-', ' ');
        const statValue = stat.base_stat;
        const percentage = Math.min((statValue / 150) * 100, 100); 
        
        return `
            <div class="stat-row">
                <span class="stat-name">${statName}</span>
                <span class="stat-value">${statValue}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="detail-header">
            <h2 class="detail-name">${pokemon.name} <span class="detail-number">#${pokemon.id.toString().padStart(3, '0')}</span></h2>
        </div>
        <div class="detail-image-container">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="detail-image">
        </div>
        <div class="detail-types">
            ${typesHtml}
        </div>
        <div class="detail-stats">
            <h3>Base Stats</h3>
            ${statsHtml}
        </div>
    `;

    modalBody.innerHTML = html;
}

function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
}

function toggleView() {
    isGridView = !isGridView;
    
    if (isGridView) {
        carouselContainer.classList.add('hidden');
        gridContainer.classList.remove('hidden');
        searchContainer.classList.remove('hidden');
        viewToggleBtn.textContent = "Show Carousel";
        document.body.style.background = "var(--background-body)";
        renderPokemon(allPokemon); 
    } else {
        gridContainer.classList.add('hidden');
        carouselContainer.classList.remove('hidden');
        searchContainer.classList.add('hidden');
        viewToggleBtn.textContent = "All Pokemons";
        updateCarousel();
        if (allPokemon[currentIndex]) {
             getPokemonDetails(currentIndex).then(details => {
                 if (details) updateTheme(details.types[0].type.name);
             });
        }
    }
}

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < allPokemon.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
        return;
    }

    if (isGridView && !modal.classList.contains('hidden')) return;

    if (!isGridView && modal.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        } else if (e.key === 'ArrowRight' && currentIndex < allPokemon.length - 1) {
            currentIndex++;
            updateCarousel();
        } else if (e.key === 'Enter') {
            const activeSlide = document.querySelector('.pokemon-slide.active');
            if (activeSlide) activeSlide.click();
        }
    }
});

viewToggleBtn.addEventListener('click', toggleView);

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

pokedexGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.pokemon-card');
    if (card) {
        const url = card.dataset.url;
        fetchPokemonDetails(url);
    }
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    if (!searchTerm) {
        renderPokemon(allPokemon);
        return;
    }
    const filteredPokemon = allPokemon.filter(pokemon => {
        return pokemon.name.toLowerCase().includes(searchTerm);
    });
    renderPokemon(filteredPokemon);
});

async function fetchPokemon() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await response.json();
        
        allPokemon = data.results.map((pokemon, index) => {
            return {
                ...pokemon,
                id: index + 1
            };
        });

        currentIndex = Math.floor(Math.random() * 151);

        updateCarousel();
    } catch (error) {
        gridContainer.innerHTML = '<p class="error-msg">Failed to load Pokemon data.</p>';
        carouselTrack.innerHTML = '<p class="error-msg">Failed to load Pokemon data.</p>';
    }
}

fetchPokemon();
