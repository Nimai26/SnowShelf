/**
 * SnowShelf - Scripts de la page de connexion
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des fonctionnalités
    initPasswordToggle();
    initLanguageSelector();
    initFormValidation();
});

/**
 * Toggle affichage/masquage du mot de passe
 */
function initPasswordToggle() {
    const toggleBtn = document.querySelector('.password-toggle');
    const passwordInput = document.getElementById('password');
    
    if (!toggleBtn || !passwordInput) return;
    
    const eyeOpen = toggleBtn.querySelector('.eye-open');
    const eyeClosed = toggleBtn.querySelector('.eye-closed');
    
    toggleBtn.addEventListener('click', function() {
        const isPassword = passwordInput.type === 'password';
        
        // Changer le type de l'input
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Changer l'icône
        eyeOpen.classList.toggle('hidden', !isPassword);
        eyeClosed.classList.toggle('hidden', isPassword);
        
        // Mettre à jour l'attribut aria-label
        this.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
    });
}

/**
 * Sélecteur de langue (liste déroulante)
 */
function initLanguageSelector() {
    const langSelect = document.getElementById('lang-select');
    
    if (!langSelect) return;
    
    langSelect.addEventListener('change', function() {
        const lang = this.value;
        
        // Sauvegarder dans un cookie (expire dans 1 an)
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie = `snowshelf_lang=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        
        // Recharger la page pour appliquer la nouvelle langue
        window.location.reload();
    });
}

/**
 * Validation du formulaire côté client
 */
function initFormValidation() {
    const form = document.querySelector('.login-form');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        
        // Retirer les erreurs précédentes
        removeFieldError(email);
        removeFieldError(password);
        
        let hasError = false;
        
        // Validation email
        if (!email || !email.value.trim()) {
            if (email) setFieldError(email);
            hasError = true;
        }
        
        // Validation mot de passe
        if (!password || !password.value) {
            if (password) setFieldError(password);
            hasError = true;
        }
        
        if (hasError) {
            e.preventDefault();
            // Ajouter effet de shake au formulaire
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        }
    });
}

/**
 * Ajouter une erreur visuelle à un champ
 */
function setFieldError(field) {
    field.classList.add('error');
    field.parentElement.classList.add('has-error');
}

/**
 * Retirer l'erreur visuelle d'un champ
 */
function removeFieldError(field) {
    field.classList.remove('error');
    field.parentElement.classList.remove('has-error');
}

/**
 * Effet de shake pour les erreurs (CSS animation)
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .login-form.shake {
        animation: shake 0.5s ease-in-out;
    }
    
    .form-group.has-error input {
        border-color: var(--error-color, #e74c3c) !important;
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2) !important;
    }
`;
document.head.appendChild(style);
