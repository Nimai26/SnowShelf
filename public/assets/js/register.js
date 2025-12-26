/**
 * SnowShelf - Scripts de la page d'inscription
 * Validation côté client et indicateur de force du mot de passe
 */

document.addEventListener('DOMContentLoaded', function() {
    initPasswordToggles();
    initPasswordStrength();
    initFormValidation();
    initLanguageSelector();
});

/**
 * Toggle affichage/masquage des mots de passe
 */
function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle');
    
    toggleBtns.forEach(toggleBtn => {
        const input = toggleBtn.parentElement.querySelector('input[type="password"], input[type="text"]');
        if (!input) return;
        
        const eyeOpen = toggleBtn.querySelector('.eye-open');
        const eyeClosed = toggleBtn.querySelector('.eye-closed');
        
        toggleBtn.addEventListener('click', function() {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            eyeOpen.classList.toggle('hidden', !isPassword);
            eyeClosed.classList.toggle('hidden', isPassword);
        });
    });
}

/**
 * Indicateur de force du mot de passe
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (!passwordInput || !strengthFill || !strengthText) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Retirer toutes les classes
        strengthFill.className = 'strength-fill';
        strengthText.className = 'strength-text';
        
        if (password.length === 0) {
            strengthFill.style.width = '0';
            strengthText.textContent = window.translations?.password_min_length || 'Min. 8 caractères, 1 chiffre, 1 caractère spécial';
            return;
        }
        
        // Appliquer la classe correspondante
        strengthFill.classList.add(strength.class);
        strengthText.classList.add(strength.class);
        strengthText.textContent = strength.text;
    });
}

/**
 * Calcule la force d'un mot de passe
 */
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    
    // Complexité
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    // Déterminer le niveau
    if (score <= 2) {
        return { 
            class: 'weak', 
            text: window.translations?.strength_weak || 'Faible'
        };
    } else if (score <= 4) {
        return { 
            class: 'medium', 
            text: window.translations?.strength_medium || 'Moyen'
        };
    } else if (score <= 6) {
        return { 
            class: 'strong', 
            text: window.translations?.strength_strong || 'Fort'
        };
    } else {
        return { 
            class: 'very-strong', 
            text: window.translations?.strength_very_strong || 'Très fort'
        };
    }
}

/**
 * Validation du formulaire
 */
function initFormValidation() {
    const form = document.getElementById('register-form');
    if (!form) return;
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('password_confirm');
    const termsCheckbox = document.getElementById('terms');
    const submitBtn = document.getElementById('submit-btn');
    
    // Validation en temps réel
    if (usernameInput) {
        usernameInput.addEventListener('blur', () => validateUsername(usernameInput));
        usernameInput.addEventListener('input', () => clearFieldError(usernameInput));
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => validateEmail(emailInput));
        emailInput.addEventListener('input', () => clearFieldError(emailInput));
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
        passwordInput.addEventListener('input', () => {
            clearFieldError(passwordInput);
            // Revalider la confirmation si elle est remplie
            if (passwordConfirmInput && passwordConfirmInput.value) {
                validatePasswordConfirm(passwordConfirmInput, passwordInput);
            }
        });
    }
    
    if (passwordConfirmInput) {
        passwordConfirmInput.addEventListener('blur', () => validatePasswordConfirm(passwordConfirmInput, passwordInput));
        passwordConfirmInput.addEventListener('input', () => clearFieldError(passwordConfirmInput));
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', function(e) {
        let isValid = true;
        
        // Valider tous les champs
        if (!validateUsername(usernameInput)) isValid = false;
        if (!validateEmail(emailInput)) isValid = false;
        if (!validatePassword(passwordInput)) isValid = false;
        if (!validatePasswordConfirm(passwordConfirmInput, passwordInput)) isValid = false;
        if (!validateTerms(termsCheckbox)) isValid = false;
        
        if (!isValid) {
            e.preventDefault();
            // Focus sur le premier champ en erreur
            const firstError = form.querySelector('.form-group.has-error input, .terms-checkbox.has-error input');
            if (firstError) firstError.focus();
            return;
        }
        
        // Désactiver le bouton et montrer le loader
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').classList.add('hidden');
        submitBtn.querySelector('.btn-loading').classList.remove('hidden');
    });
}

/**
 * Valide le nom d'utilisateur
 */
function validateUsername(input) {
    const value = input.value.trim();
    const errorSpan = document.getElementById('username-error');
    const formGroup = input.closest('.form-group');
    
    // Vide
    if (!value) {
        showFieldError(formGroup, errorSpan, window.translations?.required || 'Ce champ est obligatoire.');
        return false;
    }
    
    // Longueur minimum
    if (value.length < 3) {
        showFieldError(formGroup, errorSpan, window.translations?.username_min_length || 'Minimum 3 caractères.');
        return false;
    }
    
    // Longueur maximum
    if (value.length > 50) {
        showFieldError(formGroup, errorSpan, window.translations?.username_max_length || 'Maximum 50 caractères.');
        return false;
    }
    
    // Format (lettres, chiffres, tirets, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        showFieldError(formGroup, errorSpan, window.translations?.username_format || 'Caractères invalides.');
        return false;
    }
    
    // Valide
    clearFieldError(input);
    formGroup.classList.add('is-valid');
    return true;
}

/**
 * Valide l'email
 */
function validateEmail(input) {
    const value = input.value.trim();
    const errorSpan = document.getElementById('email-error');
    const formGroup = input.closest('.form-group');
    
    // Vide
    if (!value) {
        showFieldError(formGroup, errorSpan, window.translations?.required || 'Ce champ est obligatoire.');
        return false;
    }
    
    // Format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        showFieldError(formGroup, errorSpan, window.translations?.email_format || 'Email invalide.');
        return false;
    }
    
    // Valide
    clearFieldError(input);
    formGroup.classList.add('is-valid');
    return true;
}

/**
 * Valide le mot de passe
 */
function validatePassword(input) {
    const value = input.value;
    const errorSpan = document.getElementById('password-error');
    const formGroup = input.closest('.form-group');
    
    // Vide
    if (!value) {
        showFieldError(formGroup, errorSpan, window.translations?.required || 'Ce champ est obligatoire.');
        return false;
    }
    
    // Longueur minimum
    if (value.length < 8) {
        showFieldError(formGroup, errorSpan, window.translations?.password_min_length || 'Minimum 8 caractères.');
        return false;
    }
    
    // Au moins un chiffre
    if (!/[0-9]/.test(value)) {
        showFieldError(formGroup, errorSpan, window.translations?.password_needs_number || 'Au moins un chiffre requis.');
        return false;
    }
    
    // Au moins un caractère spécial
    if (!/[^a-zA-Z0-9]/.test(value)) {
        showFieldError(formGroup, errorSpan, window.translations?.password_needs_special || 'Au moins un caractère spécial requis.');
        return false;
    }
    
    // Valide
    clearFieldError(input);
    formGroup.classList.add('is-valid');
    return true;
}

/**
 * Valide la confirmation du mot de passe
 */
function validatePasswordConfirm(input, passwordInput) {
    const value = input.value;
    const passwordValue = passwordInput.value;
    const errorSpan = document.getElementById('password-confirm-error');
    const formGroup = input.closest('.form-group');
    
    // Vide
    if (!value) {
        showFieldError(formGroup, errorSpan, window.translations?.required || 'Ce champ est obligatoire.');
        return false;
    }
    
    // Correspondance
    if (value !== passwordValue) {
        showFieldError(formGroup, errorSpan, window.translations?.password_match || 'Les mots de passe ne correspondent pas.');
        return false;
    }
    
    // Valide
    clearFieldError(input);
    formGroup.classList.add('is-valid');
    return true;
}

/**
 * Valide les conditions d'utilisation
 */
function validateTerms(checkbox) {
    const errorSpan = document.getElementById('terms-error');
    const formGroup = checkbox.closest('.terms-checkbox');
    
    if (!checkbox.checked) {
        formGroup.classList.add('has-error');
        errorSpan.textContent = window.translations?.terms_required || 'Vous devez accepter les conditions.';
        errorSpan.classList.add('visible');
        return false;
    }
    
    formGroup.classList.remove('has-error');
    errorSpan.classList.remove('visible');
    return true;
}

/**
 * Affiche une erreur sur un champ
 */
function showFieldError(formGroup, errorSpan, message) {
    formGroup.classList.remove('is-valid');
    formGroup.classList.add('has-error');
    errorSpan.textContent = message;
    errorSpan.classList.add('visible');
}

/**
 * Efface l'erreur d'un champ
 */
function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    
    const errorSpan = formGroup.querySelector('.field-error');
    formGroup.classList.remove('has-error');
    if (errorSpan) {
        errorSpan.classList.remove('visible');
    }
}

/**
 * Sélecteur de langue
 */
function initLanguageSelector() {
    const langSelect = document.getElementById('lang-select');
    
    if (!langSelect) return;
    
    langSelect.addEventListener('change', function() {
        const lang = this.value;
        
        // Sauvegarder dans un cookie (1 an)
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);
        document.cookie = `snowshelf_lang=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        
        // Recharger la page
        window.location.reload();
    });
}
