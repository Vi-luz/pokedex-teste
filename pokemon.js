//Perfil pokemon

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Evita erro se abrir sem ID
if (!id) {
    console.error("Nenhum ID encontrado na URL!");
}

// Carregar Pokémon
async function carregarPokemon() {

    const url = `https://pokeapi.co/api/v2/pokemon/${id}`;
    const response = await fetch(url);
    const pokemon = await response.json();

    document.getElementById("nomePokemon").textContent =
        pokemon.name[0].toUpperCase() + pokemon.name.slice(1);

    const imagem =
        pokemon.sprites?.other?.["official-artwork"]?.front_default ||
        pokemon.sprites?.front_default;

    document.getElementById("sprite").src = imagem;

    document.getElementById("infoPokemon").innerHTML =`
        <p><strong>ID:</strong> ${pokemon.id}</p>
        <p><strong>Altura:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
        <p><strong>Peso:</strong> ${(pokemon.weight / 10).toFixed(1)} Kg</p>
    `;

    // Tipos
    const tiposDiv = document.getElementById("tipos");
    tiposDiv.innerHTML = "";
    pokemon.types.forEach(t => {
        tiposDiv.innerHTML += `
            <span class="type-chip tipo-${t.type.name}">
                ${t.type.name}
            </span>
        `;
    });

    // Stats
    const statusDiv = document.getElementById("stats");
    statusDiv.innerHTML = "";
    pokemon.stats.forEach(stat => {
        statusDiv.innerHTML += `
            <p>
                <strong>${stat.stat.name}</strong>: ${stat.base_stat}
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${Math.min(stat.base_stat / 2, 100)}%"></div>
                </div>    
            </p>
        `;
    });

    // Abilities
    const abilitiesDiv = document.getElementById("abilities");
    abilitiesDiv.innerHTML = pokemon.abilities
        .map(a => `<p>${a.ability.name}</p>`)
        .join("");

    // Moves
    const movesDiv = document.getElementById("movesPokemon");
    movesDiv.innerHTML = pokemon.moves
        .map(m => `<li>${m.move.name}</li>`)
        .join("");

    // Classe dinâmica do tipo
    const tipoPrincipal = pokemon.types[0].type.name;
    document.body.className = "";        // limpa
    document.body.classList.add(`tipo-${tipoPrincipal}`);

    // Favoritos
    const favBtn = document.getElementById("favPerfil");
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    favBtn.src = favoritos.includes(String(id))
        ? "assets/coracaoCheio.svg"
        : "assets/coracaoVazio.svg";

    favBtn.addEventListener("click", () => {
        let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

        if (favoritos.includes(String(id))) {
            favoritos = favoritos.filter(f => f !== String(id));
        } else {
            favoritos.push(String(id));
        }

        localStorage.setItem("favoritos", JSON.stringify(favoritos));

        favBtn.src = favoritos.includes(String(id))
            ? "assets/coracaoCheio.svg"
            : "assets/coracaoVazio.svg";
    });
}

carregarPokemon();
