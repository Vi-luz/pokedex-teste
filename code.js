document.addEventListener("DOMContentLoaded", () => {
    // Header scroll e menu mobile
    window.addEventListener("scroll", () => {
        const header = document.querySelector(".header");
        header.classList.toggle("scrolled", window.scrollY > 50);
    });

    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            document.querySelector(".container-direita").classList.toggle("ativo");
        });
    }

    // Elementos de UI
    const lista = document.getElementById("lista-pokemons");
    const inputBusca = document.getElementById("text-busca");
    const filtroTipo = document.querySelector('[name="filtro-tipo"]');
    const filtroGeracao = document.getElementById("filtro-geracao");

    // Limites por geração
    const limitesGeracao = {
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

    let pokemonsAtuais = [];

    // Função para carregar uma geração específica
    async function carregarGeracao(geracao) {
        if (!lista) return;

        lista.innerHTML = "<p style='text-align: center; font-size: 1.2rem;'>Carregando Pokémons...</p>";

        try {
            const limite = limitesGeracao[geracao];
            const promessas = [];

            // Carrega todos os pokémons da geração em paralelo
            for (let i = limite.start; i <= limite.end; i++) {
                promessas.push(
                    fetch(`https://pokeapi.co/api/v2/pokemon/${i}`)
                        .then(r => {
                            if (!r.ok) throw new Error(`Erro ${r.status}`);
                            return r.json();
                        })
                        .catch(error => {
                            console.warn(`Pokémon ${i} não carregado:`, error);
                            return null;
                        })
                );
            }

            const resultados = await Promise.all(promessas);
            pokemonsAtuais = resultados.filter(pokemon => pokemon !== null);

            if (pokemonsAtuais.length === 0) {
                lista.innerHTML = "<p class='mensagem-vazia'>Nenhum Pokémon encontrado para esta geração.</p>";
                return;
            }

            // Limpa e renderiza os cards
            lista.innerHTML = "";
            pokemonsAtuais.forEach(info => {
                const card = criarCard(info);
                lista.appendChild(card);
            });

            aplicarFiltro();
            console.log(`Carregados ${pokemonsAtuais.length} Pokémons da ${geracao}`);

        } catch (err) {
            console.error("Erro ao carregar geração:", err);
            lista.innerHTML = `
                <div class="mensagem-vazia">
                    <p>Erro ao carregar os Pokémons.</p>
                    <p style="font-size: 0.9rem;">Verifique sua conexão com a internet.</p>
                </div>
            `;
        }
    }

    // Função que determina a geração CORRETA
    function getGeracao(id) {
        if (id >= 1 && id <= 151) return "primeira-gen";
        if (id >= 152 && id <= 251) return "segunda-gen";
        if (id >= 252 && id <= 386) return "terceira-gen";
        if (id >= 387 && id <= 493) return "quarta-gen";
        if (id >= 494 && id <= 649) return "quinta-gen";
        if (id >= 650 && id <= 721) return "sexta-gen";
        if (id >= 722 && id <= 809) return "setima-gen";
        if (id >= 810 && id <= 905) return "oitava-gen";
        if (id >= 906 && id <= 1025) return "nona-gen";
        return "desconhecida";
    }

    // Criação do card
    function criarCard(info) {
        const card = document.createElement("div");
        const geracao = getGeracao(info.id);
        
        card.classList.add("pokemon-card", geracao);
        
        // Adiciona classes de tipo
        if (info.types && info.types.length > 0) {
            info.types.forEach(tipo => {
                card.classList.add(tipo.type.name);
            });
        }

        const imgSrc = info.sprites?.front_default || "";
        const nomeFormatado = info.name ? 
            info.name.charAt(0).toUpperCase() + info.name.slice(1) : 
            "Desconhecido";

        card.innerHTML = `
            <img src="${imgSrc}" alt="${nomeFormatado}" onerror="this.style.display='none'">
            <h3>${nomeFormatado}</h3>
            <p>ID: #${info.id.toString().padStart(3, '0')}</p>
            <p>Geração: ${geracao.replace("-", " ")}</p>
            <p>Tipo: ${info.types ? info.types.map(t => t.type.name).join(", ") : "Desconhecido"}</p>
        `;

        return card;
    }

    // Função que aplica filtro por tipo e busca
    function aplicarFiltro() {
        const tipo = (filtroTipo?.value || "all").toLowerCase();
        const busca = (inputBusca?.value || "").toLowerCase().trim();

        const cards = document.querySelectorAll(".pokemon-card");
        let pokemonsVisiveis = 0;
        
        cards.forEach(card => {
            const cardTipos = Array.from(card.classList).filter(cls => 
                ['normal','fire','water','grass','electric','ice','fighting','poison',
                 'ground','flying','psychic','bug','rock','ghost','dragon','dark',
                 'steel','fairy'].includes(cls)
            );
            
            const combinaTipo = tipo === "all" || cardTipos.includes(tipo);
            const combinaBusca = card.textContent.toLowerCase().includes(busca);
            
            if (combinaTipo && combinaBusca) {
                card.classList.remove("hidden");
                pokemonsVisiveis++;
            } else {
                card.classList.add("hidden");
            }
        });

        // Se não há pokémons visíveis, mostra mensagem
        if (pokemonsVisiveis === 0 && cards.length > 0) {
            const mensagemExistente = lista.querySelector('.mensagem-vazia');
            if (!mensagemExistente) {
                const mensagem = document.createElement('div');
                mensagem.className = 'mensagem-vazia';
                mensagem.textContent = 'Nenhum Pokémon encontrado com os filtros atuais.';
                lista.appendChild(mensagem);
            }
        } else {
            // Remove mensagem se houver pokémons visíveis
            const mensagemExistente = lista.querySelector('.mensagem-vazia');
            if (mensagemExistente) {
                mensagemExistente.remove();
            }
        }
    }

    // Eventos
    if (filtroTipo) {
        filtroTipo.addEventListener("change", aplicarFiltro);
    }
    
    if (filtroGeracao) {
        filtroGeracao.addEventListener("change", function() {
            carregarGeracao(this.value);
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener("input", aplicarFiltro);
    }

    // Iniciar com a primeira geração
    carregarGeracao('primeira-gen');
});