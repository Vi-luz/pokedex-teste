// header.js
document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".header");
    if (header) {
        window.addEventListener("scroll", () => {
            header.classList.toggle("scrolled", window.scrollY > 50);
        });
    }

    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const menu = document.querySelector(".container-direita");
            if (menu) menu.classList.toggle("ativo");
        });
    }

    // Fechar menu ao clicar em um link (mobile)
    const menuLinks = document.querySelectorAll(".container-direita a");
    menuLinks.forEach(link => {
        link.addEventListener("click", () => {
            const menu = document.querySelector(".container-direita");
            if (window.innerWidth <= 768 && menu) {
                menu.classList.remove("ativo");
            }
        });
    });

    // Fechar menu ao redimensionar a tela
    window.addEventListener("resize", () => {
        const menu = document.querySelector(".container-direita");
        if (window.innerWidth > 768 && menu) {
            menu.classList.remove("ativo");
        }
    });
});