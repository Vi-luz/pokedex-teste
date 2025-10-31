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
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroGeracao = document.getElementById("filtro-geracao");

    // Cache de pokémons já carregados
    const pokemonsCache = new Map();
    let pokemonsAtuais = [];
    let geracaoAtual = 'primeira-gen';
    let modoBuscaGlobal = false;

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

    // Função para buscar UM pokémon
    async function buscarPokemon(id) {
        if (pokemonsCache.has(id)) {
            return pokemonsCache.get(id);
        }

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!response.ok) throw new Error(`Erro ${response.status}`);
            
            const data = await response.json();
            pokemonsCache.set(id, data);
            return data;
        } catch (error) {
            console.warn(`Pokémon ${id} não carregado:`, error);
            return null;
        }
    }

    // NOVA FUNÇÃO: Buscar pokémon por nome (para busca global)
    async function buscarPokemonPorNome(nome) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome.toLowerCase()}`);
            if (!response.ok) throw new Error(`Pokémon não encontrado`);
            
            const data = await response.json();
            // Adiciona ao cache pelo ID também
            pokemonsCache.set(data.id, data);
            return data;
        } catch (error) {
            console.warn(`Pokémon "${nome}" não encontrado:`, error);
            return null;
        }
    }

    // NOVA FUNÇÃO: Busca global entre todas as gerações
    async function buscarGlobalmente(termoBusca) {
        if (!termoBusca.trim()) {
            // Se a busca está vazia, volta para o modo normal
            modoBuscaGlobal = false;
            carregarPokemons(geracaoAtual, 1, 20);
            return;
        }

        modoBuscaGlobal = true;
        lista.innerHTML = "<p style='text-align: center; font-size: 1.2rem; color: white;'>Buscando Pokémon...</p>";

        try {
            // Tenta buscar pelo nome primeiro (mais rápido se encontrar)
            let pokemonEncontrado = await buscarPokemonPorNome(termoBusca);
            
            if (pokemonEncontrado) {
                // Se encontrou pelo nome, mostra só esse
                pokemonsAtuais = [pokemonEncontrado];
                lista.innerHTML = "";
                const card = criarCard(pokemonEncontrado);
                lista.appendChild(card);
            } else {
                // Se não encontrou pelo nome, busca em todas as gerações
                pokemonsAtuais = [];
                lista.innerHTML = "<p style='text-align: center; font-size: 1.2rem; color: white;'>Buscando em todas as gerações...</p>";

                // Busca em TODOS os pokémons (isso pode ser lento, então limitamos)
                const todosIds = [];
                for (let gen in limitesGeracao) {
                    const limite = limitesGeracao[gen];
                    for (let i = limite.start; i <= limite.end; i++) {
                        todosIds.push(i);
                    }
                }

                // Carrega em lotes para não travar o navegador
                const resultados = [];
                const tamanhoLote = 50;
                
                for (let i = 0; i < todosIds.length; i += tamanhoLote) {
                    const lote = todosIds.slice(i, i + tamanhoLote);
                    const promessas = lote.map(id => buscarPokemon(id));
                    const resultadosLote = await Promise.all(promessas);
                    
                    // Filtra os que combinam com a busca
                    const combinam = resultadosLote.filter(pokemon => 
                        pokemon && pokemon.name.toLowerCase().includes(termoBusca.toLowerCase())
                    );
                    
                    resultados.push(...combinam);
                    
                    // Atualiza a interface a cada lote
                    if (resultados.length > 0) {
                        lista.innerHTML = "";
                        resultados.forEach(info => {
                            const card = criarCard(info);
                            lista.appendChild(card);
                        });
                        lista.innerHTML += `<p style='text-align: center; color: white;'>Encontrados ${resultados.length} pokémons... Buscando mais...</p>`;
                    }
                }

                pokemonsAtuais = resultados;
                
                if (pokemonsAtuais.length === 0) {
                    lista.innerHTML = `
                        <div class="mensagem-vazia">
                            <p>Nenhum Pokémon encontrado com o termo "${termoBusca}".</p>
                            <p style="font-size: 0.9rem;">Tente buscar pelo nome em inglês.</p>
                        </div>
                    `;
                } else {
                    lista.innerHTML = "";
                    pokemonsAtuais.forEach(info => {
                        const card = criarCard(info);
                        lista.appendChild(card);
                    });
                    
                    lista.innerHTML += `<p style='text-align: center; color: #ffcb05; margin-top: 1rem;'>
                        🎉 Encontrados ${pokemonsAtuais.length} pokémons com "${termoBusca}"!
                    </p>`;
                }
            }

            aplicarFiltro();

        } catch (err) {
            console.error("Erro na busca global:", err);
            lista.innerHTML = `
                <div class="mensagem-vazia">
                    <p>Erro ao buscar Pokémon.</p>
                    <p style="font-size: 0.9rem;">Verifique sua conexão com a internet.</p>
                </div>
            `;
        }
    }

    // Função para carregar pokémons com paginação (modo normal)
    async function carregarPokemons(geracao, pagina = 1, itensPorPagina = 20) {
        if (!lista) return;

        const limite = limitesGeracao[geracao];
        geracaoAtual = geracao;
        modoBuscaGlobal = false;

        // Calcula quais IDs carregar
        const startId = limite.start + ((pagina - 1) * itensPorPagina);
        const endId = Math.min(startId + itensPorPagina - 1, limite.end);

        // Mostra loading apenas na primeira página
        if (pagina === 1) {
            lista.innerHTML = "<p style='text-align: center; font-size: 1.2rem; color: white;'>Carregando Pokémons...</p>";
            pokemonsAtuais = [];
        }

        try {
            const idsParaCarregar = [];
            for (let i = startId; i <= endId; i++) {
                idsParaCarregar.push(i);
            }

            // Carrega os pokémons em paralelo
            const promessas = idsParaCarregar.map(id => buscarPokemon(id));
            const resultados = await Promise.all(promessas);
            
            const novosPokemons = resultados.filter(pokemon => pokemon !== null);
            pokemonsAtuais = [...pokemonsAtuais, ...novosPokemons];

            // Renderiza os cards
            if (pagina === 1) {
                lista.innerHTML = "";
            }

            novosPokemons.forEach(info => {
                const card = criarCard(info);
                lista.appendChild(card);
            });

            // Adiciona botão "Carregar Mais" se houver mais pokémons
            adicionarBotaoCarregarMais(geracao, pagina, itensPorPagina);

            aplicarFiltro();
            console.log(`Carregados ${novosPokemons.length} Pokémons (página ${pagina})`);

        } catch (err) {
            console.error("Erro ao carregar pokémons:", err);
            lista.innerHTML = `
                <div class="mensagem-vazia">
                    <p>Erro ao carregar os Pokémons.</p>
                    <p style="font-size: 0.9rem;">Verifique sua conexão com a internet.</p>
                </div>
            `;
        }
    }

    // Função para adicionar botão "Carregar Mais"
    function adicionarBotaoCarregarMais(geracao, paginaAtual, itensPorPagina) {
        // Remove botão anterior se existir
        const botaoAnterior = document.getElementById('botao-carregar-mais');
        if (botaoAnterior) {
            botaoAnterior.remove();
        }

        // Não mostra botão em modo de busca global
        if (modoBuscaGlobal) return;

        const limite = limitesGeracao[geracao];
        const totalPokemons = limite.end - limite.start + 1;
        const totalCarregados = pokemonsAtuais.length;

        if (totalCarregados < totalPokemons) {
            const botao = document.createElement('button');
            botao.id = 'botao-carregar-mais';
            botao.textContent = `Carregar Mais Pokémons (${totalCarregados}/${totalPokemons})`;
            botao.className = 'botao-carregar-mais';
            botao.addEventListener('click', () => {
                carregarPokemons(geracao, paginaAtual + 1, itensPorPagina);
            });
            lista.appendChild(botao);
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
        
        card.classList.add("pokemon-card");
        
        // Adiciona classes de tipo
        if (info.types && info.types.length > 0) {
            info.types.forEach(tipoInfo => {
                card.classList.add(tipoInfo.type.name);
            });
        }

        const imgSrc = info.sprites?.other?.['official-artwork']?.front_default || 
                      info.sprites?.front_default || 
                      "";
        const nomeFormatado = info.name ? 
            info.name.charAt(0).toUpperCase() + info.name.slice(1) : 
            "Desconhecido";

        const tiposFormatados = info.types ? 
            info.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(", ") : 
            "Desconhecido";

        card.innerHTML = `
            <img src="${imgSrc}" alt="${nomeFormatado}" loading="lazy" onerror="this.style.display='none'">
            <h3>${nomeFormatado}</h3>
            <p>ID: #${info.id.toString().padStart(3, '0')}</p>
            <p>Geração: ${geracao.replace("-gen", "").replace("-", " ")}</p>
            <p>Tipo: ${tiposFormatados}</p>
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
            
            const combinaTipo = tipo === "all" || cardTipos.some(cardTipo => cardTipo === tipo);
            const combinaBusca = card.textContent.toLowerCase().includes(busca);
            
            if (combinaTipo && combinaBusca) {
                card.style.display = "block";
                pokemonsVisiveis++;
            } else {
                card.style.display = "none";
            }
        });

        // Gerencia mensagem de "nenhum resultado"
        const mensagemExistente = lista.querySelector('.mensagem-vazia');
        const botaoCarregarMais = document.getElementById('botao-carregar-mais');

        if (pokemonsVisiveis === 0 && cards.length > 0) {
            if (!mensagemExistente) {
                const mensagem = document.createElement('div');
                mensagem.className = 'mensagem-vazia';
                mensagem.textContent = 'Nenhum Pokémon encontrado com os filtros atuais.';
                lista.appendChild(mensagem);
            }
            if (botaoCarregarMais) {
                botaoCarregarMais.style.display = 'none';
            }
        } else {
            if (mensagemExistente) {
                mensagemExistente.remove();
            }
            if (botaoCarregarMais && !modoBuscaGlobal) {
                botaoCarregarMais.style.display = 'block';
            }
        }
    }

    // Eventos
    if (filtroTipo) {
        filtroTipo.addEventListener("change", aplicarFiltro);
    }
    
    if (filtroGeracao) {
        filtroGeracao.addEventListener("change", function() {
            // Limpa a busca quando muda de geração
            if (inputBusca) inputBusca.value = "";
            pokemonsAtuais = [];
            carregarPokemons(this.value, 1, 20);
        });
    }
    
    if (inputBusca) {
        let timeoutBusca;
        inputBusca.addEventListener("input", function() {
            clearTimeout(timeoutBusca);
            const termo = this.value.trim();
            
            // Debounce - espera o usuário parar de digitar
            timeoutBusca = setTimeout(() => {
                if (termo.length >= 2) {
                    // Busca global se tem pelo menos 2 caracteres
                    buscarGlobalmente(termo);
                } else if (termo.length === 0) {
                    // Volta para o modo normal se a busca está vazia
                    modoBuscaGlobal = false;
                    carregarPokemons(geracaoAtual, 1, 20);
                }
            }, 500);
        });
    }

    // Iniciar com a primeira geração
    carregarPokemons('primeira-gen', 1, 20);
});