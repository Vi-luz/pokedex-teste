document.addEventListener("DOMContentLoaded", async () => {
    const favDiv = document.querySelector(".fav");

    // Evita quebra se não estiver na página de favoritos
    if (!favDiv) return;

    const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    if (favoritos.length === 0) {
        favDiv.innerHTML = "<p>Nenhum Pokémon favoritado ainda.</p>";
        return;
    }

    for (const id of favoritos) {

        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok) continue; // Evita quebra

        const p = await res.json();
        const img = p.sprites.other["official-artwork"].front_default;

        const card = document.createElement("div");
        card.classList.add("fav-card");
        card.innerHTML = `
            <img src="${img}" alt="${p.name}">
            <p>${p.name}</p>
        `;

        card.addEventListener("click", () => {
            window.location.href = `pokemon.html?id=${id}`;
        });

        favDiv.appendChild(card);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const imgPerfil = document.querySelector(".perfilImage");
    const botaoEditar = document.querySelector(".edit-icon");
    const inputUpload = document.getElementById("perfilUpload");

    botaoEditar.addEventListener("click", () => {
        inputUpload.click();
    });

    inputUpload.addEventListener("change", function (){
        const file = this.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const dataUrl = e.target.result;

            imgPerfil.src = dataUrl;

            localStorage.setItem("fotoPerfil", dataUrl);
        };
        reader.readAsDataURL(file);
    });

    const saved = localStorage.getItem("fotoPerfil");
    if(saved) {
        imgPerfil.src - saved;
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const userName = document.getElementById("userName");
    const savedName = localStorage.getItem("nomeUsuario");
    if(savedName) {
        userName.textContent = savedName;
    }
    userName.addEventListener("input", () =>{
        localStorage.setItem("nomeUsuario", userName.textContent.trim());
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const sobreMim = document.querySelector(".text-area");

    // Carrega texto salvo
    const savedText = localStorage.getItem("sobreMim");
    if (savedText) {
        sobreMim.value = savedText;
    }

    // Salva a cada modificação
    sobreMim.addEventListener("input", () => {
        localStorage.setItem("sobreMim", sobreMim.value.trim());
    });
});
