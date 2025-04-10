const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const pokemonImage = document.getElementById('pokemon-image');
const pokemonName = document.getElementById('pokemon-name');
const pokemonTypes = document.getElementById('pokemon-types');
const pokemonHeight = document.getElementById('pokemon-height');
const pokemonWeight = document.getElementById('pokemon-weight');
const pokemonAbilities = document.getElementById('pokemon-abilities');
const pokemonDescription = document.getElementById('pokemon-description');
const relatedPokemonContainer = document.getElementById('related-pokemon-container');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const evolutionChain = document.getElementById('evolution-chain');

let allPokemonNames = [];
let debounceTimer;

async function fetchAllPokemonNames() {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const data = await response.json();
        allPokemonNames = data.results.map(pokemon => pokemon.name);
    } catch (error) {
        console.error('Error fetching Pokemon names:', error);
    }
}

function showSuggestions(input) {
    suggestionsDropdown.innerHTML = '';
    if (!input) {
        suggestionsDropdown.classList.remove('active');
        return;
    }

    const filteredPokemon = allPokemonNames
        .filter(name => name.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 5);

    if (filteredPokemon.length > 0) {
        filteredPokemon.forEach(pokemon => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${allPokemonNames.indexOf(pokemon) + 1}.png" alt="${pokemon}">
                <span>${pokemon}</span>
            `;
            suggestionItem.addEventListener('click', () => {
                searchInput.value = pokemon;
                suggestionsDropdown.classList.remove('active');
                handleSearch();
            });
            suggestionsDropdown.appendChild(suggestionItem);
        });
        suggestionsDropdown.classList.add('active');
    } else {
        suggestionsDropdown.classList.remove('active');
    }
}

function handleSearchInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        showSuggestions(searchInput.value);
    }, 300);
}

async function fetchPokemonSpeciesData(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName.toLowerCase()}`);
        if (!response.ok) {
            throw new Error('Pokemon species not found');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Pokemon species data:', error);
        return null;
    }
}

async function fetchEvolutionChain(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Evolution chain not found');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching evolution chain:', error);
        return null;
    }
}

async function fetchPokemonData(pokemonName) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        if (!response.ok) {
            throw new Error('Pokemon not found');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Pokemon data:', error);
        return null;
    }
}

async function fetchRelatedPokemon(type) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
        if (!response.ok) {
            throw new Error('Type not found');
        }
        const data = await response.json();
        return data.pokemon.slice(0, 5);
    } catch (error) {
        console.error('Error fetching related Pokemon:', error);
        return [];
    }
}

async function displayEvolutionChain(chain) {
    evolutionChain.innerHTML = '';
    
    const createEvolutionStage = async (pokemon) => {
        const stage = document.createElement('div');
        stage.className = 'evolution-stage';
        
        const pokemonData = await fetchPokemonData(pokemon.species.name);
        if (pokemonData) {
            stage.innerHTML = `
                <img src="${pokemonData.sprites.other['official-artwork'].front_default}" alt="${pokemon.species.name}">
                <span>${pokemon.species.name}</span>
            `;
            stage.addEventListener('click', () => {
                displayPokemonData(pokemonData);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        return stage;
    };

    const displayChain = async (chain) => {
        const stage = await createEvolutionStage(chain);
        evolutionChain.appendChild(stage);

        if (chain.evolves_to && chain.evolves_to.length > 0) {
            const arrow = document.createElement('div');
            arrow.className = 'evolution-arrow';
            arrow.innerHTML = '→';
            evolutionChain.appendChild(arrow);

            for (const evolution of chain.evolves_to) {
                await displayChain(evolution);
            }
        }
    };

    await displayChain(chain);
}

async function displayPokemonData(pokemon) {
    pokemonImage.src = pokemon.sprites.other['official-artwork'].front_default;
    pokemonImage.alt = pokemon.name;
    pokemonName.textContent = pokemon.name;
    pokemonName.className = `type-${pokemon.types[0].type.name}`;

    pokemonTypes.innerHTML = '';
    pokemon.types.forEach(type => {
        const typeElement = document.createElement('span');
        typeElement.className = `type ${type.type.name}`;
        typeElement.textContent = type.type.name;
        pokemonTypes.appendChild(typeElement);
    });

    pokemonHeight.textContent = `${pokemon.height / 10}m`;
    pokemonWeight.textContent = `${pokemon.weight / 10}kg`;
    pokemonAbilities.textContent = pokemon.abilities.map(ability => ability.ability.name).join(', ');

    const speciesData = await fetchPokemonSpeciesData(pokemon.name);
    if (speciesData) {
        const englishDescription = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
        if (englishDescription) {
            pokemonDescription.textContent = englishDescription.flavor_text.replace(/\f/g, ' ');
        }

        if (speciesData.evolution_chain) {
            const evolutionData = await fetchEvolutionChain(speciesData.evolution_chain.url);
            if (evolutionData) {
                displayEvolutionChain(evolutionData.chain);
            }
        }
    }

    const mainType = pokemon.types[0].type.name;
    const relatedPokemon = await fetchRelatedPokemon(mainType);
    displayRelatedPokemon(relatedPokemon);
}

async function displayRelatedPokemon(relatedPokemon) {
    relatedPokemonContainer.innerHTML = '';
    
    for (const pokemon of relatedPokemon) {
        const pokemonData = await fetchPokemonData(pokemon.pokemon.name);
        if (pokemonData) {
            const card = document.createElement('div');
            card.className = 'related-pokemon-card';
            card.innerHTML = `
                <img src="${pokemonData.sprites.other['official-artwork'].front_default}" alt="${pokemonData.name}">
                <h4>${pokemonData.name}</h4>
            `;
            card.addEventListener('click', () => {
                displayPokemonData(pokemonData);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            relatedPokemonContainer.appendChild(card);
        }
    }
}

async function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    const pokemonData = await fetchPokemonData(searchTerm);
    if (pokemonData) {
        displayPokemonData(pokemonData);
        searchInput.value = '';
        suggestionsDropdown.classList.remove('active');
    } else {
        alert('Pokemon not found! Please try another name or number.');
    }
}

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});
searchInput.addEventListener('input', handleSearchInput);

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        suggestionsDropdown.classList.remove('active');
    }
});

fetchAllPokemonNames();
fetchPokemonData('pikachu').then(displayPokemonData); 
