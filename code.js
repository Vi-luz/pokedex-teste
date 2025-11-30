document.addEventListener("DOMContentLoaded", () => {

    const lista = document.getElementById("lista-pokemons");
    const inputBusca = document.getElementById("text-busca");
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroGeracao = document.getElementById("filtro-geracao");

    // Se não estamos na Pokédex, não rodamos o restante
    if (!lista) return;

    let paginaAtual = 1;
    const itensPorPagina = 20;

    let ultimoFiltroTipo = "all";
    let ultimoFiltroGeracao = "all-gen";

    const limitesGeracao = {
        'all-gen': { start: 1, end: 1025 },
        'primeira-gen': { start: 1, end: 151 },
        'segunda-gen': { start: 152, end: 251 },
        'terceira-gen': { start: 252, end: 386 },
        'quarta-gen': { start: 387, end: 493 },
        'quinta-gen': { start: 494, end: 649 },
        'sexta-gen': { start: 650, end: 721 },
        'setima-gen': { start: 722, end: 809 },
        'oitava-gen': { start: 810, end: 905 },
        'nona-gen': { start: 906, end: 1025 }
    };

    async function fetchLoad(filtroTipo = "all", filtroGeracao = "all-gen", pagina = 1) {

        if (pagina === 1) lista.innerHTML = "";

        ultimoFiltroTipo = filtroTipo;
        ultimoFiltroGeracao = filtroGeracao;

        const limites = limitesGeracao[filtroGeracao];
        const inicio = limites.start + (pagina - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina - 1, limites.end);

        for (let id = inicio; id <= fim; id++) {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!res.ok) continue;

            const data = await res.json();
            const tipos = data.types.map(t => t.type.name);

            if (filtroTipo !== "all" && !tipos.includes(filtroTipo)) continue;

            criarCard(data);
        }

        criarBotaoCarregar(filtroGeracao, pagina);
    }

    async function fetchPokemon(busca) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${busca.toLowerCase()}`);
            if (!response.ok) throw new Error();
            return await response.json();
        } catch {
            return null;
        }
    }

    function criarCard(pokemon) {
        const tipo = pokemon.types[0].type.name;
        const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
        const isFav = favoritos.includes(String(pokemon.id));

        const card = document.createElement("div");
        card.classList.add("pokemon-card", tipo);

        const imgURL = pokemon.sprites.other["official-artwork"].front_default;

        card.innerHTML = `
            <img class="fav-icon"
                data-id="${pokemon.id}"
                src="assets/${isFav ? 'coracaoCheio.svg' : 'coracaoVazio.svg'}"
                alt="Favoritar">

            <img class="poke_image" src="${imgURL}" alt="${pokemon.name}">
            <h3>${pokemon.name.toUpperCase()}</h3>
            <p><strong>ID:</strong> ${pokemon.id}</p>
            <p><strong>Tipos:</strong> ${pokemon.types.map(t => t.type.name).join(", ")}</p>
        `;

        // Clique geral
        card.addEventListener("click", () => {
            window.location.href = `pokemon.html?id=${pokemon.id}`;
        });

        // Clique no favorito
        const favIcon = card.querySelector(".fav-icon");
        favIcon.addEventListener("click", toggleFavorito);

        lista.appendChild(card);

        setTimeout(() => card.querySelector(".poke_image").classList.add("show"), 50);
    }

    if (filtroTipo) {
        filtroTipo.addEventListener("change", () => {
            paginaAtual = 1;
            fetchLoad(filtroTipo.value, filtroGeracao.value, paginaAtual);
        });
    }

    if (filtroGeracao) {
        filtroGeracao.addEventListener("change", () => {
            paginaAtual = 1;
            fetchLoad(filtroTipo.value, filtroGeracao.value, paginaAtual);
        });
    }

    if (inputBusca) {
        inputBusca.addEventListener("keyup", async () => {
            const termo = inputBusca.value.trim();

            if (termo === "") {
                paginaAtual = 1;
                fetchLoad(filtroTipo.value, filtroGeracao.value, paginaAtual);
                return;
            }

            const btn = document.getElementById("botao-carregar-mais");
            if (btn) btn.remove();

            const poke = await fetchPokemon(termo);
            lista.innerHTML = "";

            if (!poke) {
                lista.innerHTML = `<div class="mensagem-vazia">Pokémon não encontrado.</div>`;
                return;
            }

            criarCard(poke);
        });
    }

    function criarBotaoCarregar(geracao, pagina) {
        const botaoAnterior = document.getElementById("botao-carregar-mais");
        if (botaoAnterior) botaoAnterior.remove();

        const limites = limitesGeracao[geracao];
        const totalPorGeracao = limites.end - limites.start + 1;

        const totalCarregado = pagina * itensPorPagina;

        if (totalCarregado >= totalPorGeracao) return;

        const botao = document.createElement("button");
        botao.id = "botao-carregar-mais";
        botao.textContent = "Carregar mais Pokémon";
        botao.className = "botao-carregar-mais";

        botao.addEventListener("click", () => {
            paginaAtual++;
            fetchLoad(ultimoFiltroTipo, ultimoFiltroGeracao, paginaAtual);
        });

        lista.appendChild(botao);
    }

    function toggleFavorito(event) {
        event.stopPropagation();

        const id = event.target.getAttribute("data-id");
        let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

        if (favoritos.includes(id)) {
            favoritos = favoritos.filter(f => f !== id);
        } else {
            favoritos.push(id);
        }

        localStorage.setItem("favoritos", JSON.stringify(favoritos));

        event.target.src = favoritos.includes(id)
            ? "assets/coracaoCheio.svg"
            : "assets/coracaoVazio.svg";
    }

    fetchLoad(); // seguro agora
});
