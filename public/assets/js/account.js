/**
 * SnowShelf - Account Page JavaScript
 * Gestion du compte utilisateur : profil, sécurité, apparence, confidentialité
 */

(function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const API_USERS = 'api/users.php';

    // ========================================
    // DOM Elements (réinitialisés à chaque init)
    // ========================================
    let elements = {};

    function initElements() {
        elements = {
            // Profile
            profileForm: document.getElementById('profileForm'),
            avatarFile: document.getElementById('avatarFile'),
            changeAvatarBtn: document.getElementById('changeAvatarBtn'),
            removeAvatarBtn: document.getElementById('removeAvatarBtn'),
            avatarPreview: document.getElementById('avatarPreview'),
            avatarImg: document.getElementById('avatarImg'),
            avatarInitials: document.getElementById('avatarInitials'),
            
            // Security
            passwordForm: document.getElementById('passwordForm'),
            currentPassword: document.getElementById('currentPassword'),
            newPassword: document.getElementById('newPassword'),
            confirmPassword: document.getElementById('confirmPassword'),
            strengthFill: document.getElementById('strengthFill'),
            strengthText: document.getElementById('strengthText'),
            passwordMatch: document.getElementById('passwordMatch'),
            changePasswordBtn: document.getElementById('changePasswordBtn'),
            deleteAccountBtn: document.getElementById('deleteAccountBtn'),
            
            // Appearance
            appearanceForm: document.getElementById('appearanceForm'),
            userTheme: document.getElementById('userTheme'),
            userLang: document.getElementById('userLang'),
            backgroundFile: document.getElementById('backgroundFile'),
            selectBackgroundBtn: document.getElementById('selectBackgroundBtn'),
            removeBackgroundBtn: document.getElementById('removeBackgroundBtn'),
            backgroundPreview: document.getElementById('backgroundPreview'),
            backgroundPreviewImg: document.getElementById('backgroundPreviewImg'),
            backgroundPlaceholder: document.getElementById('backgroundPlaceholder'),
            
            // Privacy
            privacyForm: document.getElementById('privacyForm'),
            
            // Delete Account Modal
            deleteAccountModal: document.getElementById('deleteAccountModal'),
            deleteModalClose: document.getElementById('deleteModalClose'),
            deleteModalCancel: document.getElementById('deleteModalCancel'),
            deleteModalConfirm: document.getElementById('deleteModalConfirm'),
            deleteConfirmPassword: document.getElementById('deleteConfirmPassword'),
            
            // Toast
            toastContainer: document.getElementById('toastContainer'),
            
            // Account Tabs (SPA)
            accountTabs: document.querySelectorAll('.account-tab[data-section]'),
            accountSections: document.querySelectorAll('.account-section[data-section]')
        };
    }

    // ========================================
    // Initialization
    // ========================================
    function init() {
        initElements();
        bindEvents();
        initApiKeys();
    }

    function bindEvents() {
        // Account Tabs (SPA navigation)
        if (elements.accountTabs) {
            elements.accountTabs.forEach(tab => {
                tab.addEventListener('click', handleTabClick);
            });
        }
        
        // Profile Form
        if (elements.profileForm) {
            elements.profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        // Avatar
        if (elements.changeAvatarBtn) {
            elements.changeAvatarBtn.addEventListener('click', () => elements.avatarFile.click());
        }
        if (elements.avatarFile) {
            elements.avatarFile.addEventListener('change', handleAvatarSelect);
        }
        if (elements.removeAvatarBtn) {
            elements.removeAvatarBtn.addEventListener('click', handleRemoveAvatar);
        }
        
        // Password Form
        if (elements.passwordForm) {
            elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
        }
        if (elements.newPassword) {
            elements.newPassword.addEventListener('input', checkPasswordStrength);
        }
        if (elements.confirmPassword) {
            elements.confirmPassword.addEventListener('input', checkPasswordMatch);
        }
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', togglePasswordVisibility);
        });
        
        // Delete Account
        if (elements.deleteAccountBtn) {
            elements.deleteAccountBtn.addEventListener('click', openDeleteModal);
        }
        if (elements.deleteModalClose) {
            elements.deleteModalClose.addEventListener('click', closeDeleteModal);
        }
        if (elements.deleteModalCancel) {
            elements.deleteModalCancel.addEventListener('click', closeDeleteModal);
        }
        if (elements.deleteModalConfirm) {
            elements.deleteModalConfirm.addEventListener('click', handleDeleteAccount);
        }
        if (elements.deleteAccountModal) {
            elements.deleteAccountModal.querySelector('.modal-backdrop').addEventListener('click', closeDeleteModal);
        }
        
        // Appearance Form
        if (elements.appearanceForm) {
            elements.appearanceForm.addEventListener('submit', handleAppearanceSubmit);
        }
        if (elements.userTheme) {
            elements.userTheme.addEventListener('change', previewTheme);
        }
        if (elements.selectBackgroundBtn) {
            elements.selectBackgroundBtn.addEventListener('click', () => elements.backgroundFile.click());
        }
        if (elements.backgroundFile) {
            elements.backgroundFile.addEventListener('change', handleBackgroundSelect);
        }
        if (elements.removeBackgroundBtn) {
            elements.removeBackgroundBtn.addEventListener('click', handleRemoveBackground);
        }
        
        // Privacy Form
        if (elements.privacyForm) {
            elements.privacyForm.addEventListener('submit', handlePrivacySubmit);
        }
    }

    // ========================================
    // Tab Navigation (SPA)
    // ========================================
    function handleTabClick(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        if (!section) return;
        
        // Mettre à jour les tabs actifs
        elements.accountTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === section);
        });
        
        // Afficher/cacher les sections
        elements.accountSections.forEach(sec => {
            sec.classList.toggle('active', sec.dataset.section === section);
        });
        
        // Mettre à jour l'URL sans recharger (optionnel)
        const url = new URL(window.location);
        url.searchParams.set('section', section);
        history.replaceState(null, '', url);
    }

    // ========================================
    // Profile Functions
    // ========================================
    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const currentEmail = document.getElementById('userEmail').defaultValue;
        const newEmail = formData.get('email');
        const newName = formData.get('name');
        const emailChanged = currentEmail !== newEmail;
        
        // Avertir si l'email change
        if (emailChanged) {
            const confirmChange = confirm(
                'Attention : Le changement d\'adresse email vous déconnectera.\n' +
                'Vous devrez vous reconnecter avec votre nouvelle adresse.\n\n' +
                'Voulez-vous continuer ?'
            );
            if (!confirmChange) {
                return;
            }
        }
        
        const data = {
            name: newName,
            email: newEmail,
            Desc_Collec: formData.get('Desc_Collec'),
            newsletter: formData.get('newsletter') ? 1 : 0
        };
        
        try {
            const response = await fetch(`${API_USERS}?me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Si l'email a changé, rediriger vers la déconnexion
                if (emailChanged) {
                    showToast('success', 'Email modifié. Redirection vers la connexion...');
                    setTimeout(() => {
                        window.location.href = 'auth/logout.php?reason=email_changed';
                    }, 2000);
                    return;
                }
                
                showToast('success', 'Profil mis à jour avec succès');
                
                // Mettre à jour le nom partout si changé
                if (newName) {
                    updateUsernameEverywhere(newName);
                }
            } else {
                showToast('error', result.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    /**
     * Met à jour le nom d'utilisateur dans tous les éléments de la page
     */
    function updateUsernameEverywhere(newName) {
        // Sidebar footer
        const sidebarUserName = document.querySelector('.sidebar-user .user-name');
        if (sidebarUserName) {
            sidebarUserName.textContent = newName;
        }
        
        // Header user menu
        const headerUserName = document.querySelector('.user-menu-toggle .user-name');
        if (headerUserName) {
            headerUserName.textContent = newName;
        }
        
        // Dropdown username
        const dropdownUsername = document.querySelector('.dropdown-username');
        if (dropdownUsername) {
            dropdownUsername.textContent = newName;
        }
        
        // Mettre à jour les initiales si pas d'avatar
        const initials = newName.substring(0, 1).toUpperCase();
        const initialsDouble = newName.substring(0, 2).toUpperCase();
        
        // Sidebar avatar initials
        const sidebarAvatarInitials = document.querySelector('.sidebar-user .user-avatar .avatar-initials');
        if (sidebarAvatarInitials) {
            sidebarAvatarInitials.textContent = initials;
        }
        
        // Header avatar (si pas d'image)
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar && !headerAvatar.querySelector('img')) {
            headerAvatar.textContent = initials;
        }
        
        // Dropdown avatar (si pas d'image)
        const dropdownAvatar = document.getElementById('dropdownAvatar');
        if (dropdownAvatar && !dropdownAvatar.querySelector('img')) {
            dropdownAvatar.textContent = initials;
        }
        
        // Preview avatar initials
        const avatarInitials = document.getElementById('avatarInitials');
        if (avatarInitials) {
            avatarInitials.textContent = initialsDouble;
        }
        
        // Cookie pour le nom (optionnel, pour persistance côté client)
        document.cookie = `snowshelf_username=${encodeURIComponent(newName)};path=/;max-age=31536000`;
    }
    
    async function handleAvatarSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Veuillez sélectionner une image');
            return;
        }
        
        // Vérifier la taille (max 2 Mo)
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'L\'image ne doit pas dépasser 2 Mo');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch(`${API_USERS}?action=upload_avatar`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Avatar mis à jour');
                // Cache-buster pour forcer le rafraîchissement
                const cacheBuster = `?v=${Date.now()}`;
                const avatarUrl = result.data.url + cacheBuster;
                
                // Mettre à jour la preview principale
                if (elements.avatarPreview) {
                    elements.avatarPreview.innerHTML = `<img src="${avatarUrl}" alt="Avatar" id="avatarImg">`;
                }
                // Mettre à jour l'avatar dans la sidebar (nav link)
                const sidebarAvatar = document.getElementById('sidebarAvatar');
                if (sidebarAvatar) {
                    sidebarAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
                } else {
                    // Créer l'élément si l'avatar n'existait pas (remplacer l'icône SVG)
                    const navLink = document.querySelector('.nav-link[data-page="account"]');
                    if (navLink) {
                        const svgIcon = navLink.querySelector('.nav-icon');
                        if (svgIcon) {
                            const avatarDiv = document.createElement('div');
                            avatarDiv.className = 'nav-avatar';
                            avatarDiv.id = 'sidebarAvatar';
                            avatarDiv.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
                            svgIcon.replaceWith(avatarDiv);
                        }
                    }
                }
                // Mettre à jour le header (si présent)
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar) {
                    headerAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
                }
                // Mettre à jour le dropdown (si présent)
                const dropdownAvatar = document.getElementById('dropdownAvatar');
                if (dropdownAvatar) {
                    dropdownAvatar.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
                }
                // Afficher le bouton supprimer
                if (elements.removeAvatarBtn) {
                    elements.removeAvatarBtn.style.display = '';
                }
            } else {
                showToast('error', result.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    async function handleRemoveAvatar() {
        if (!confirm('Supprimer votre avatar ?')) return;
        
        try {
            const response = await fetch(`${API_USERS}?action=delete_avatar`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Avatar supprimé');
                // Remettre les initiales
                const userName = document.getElementById('userName');
                const initials = userName ? userName.value.substring(0, 2).toUpperCase() : 'U';
                const initialSingle = initials.charAt(0);
                
                // Icône SVG par défaut pour la sidebar
                const defaultSvgIcon = `<svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>`;
                
                // Mettre à jour la preview principale
                if (elements.avatarPreview) {
                    elements.avatarPreview.innerHTML = `<span class="avatar-initials-large" id="avatarInitials">${initials}</span>`;
                }
                // Mettre à jour la sidebar (nav link) - restaurer l'icône SVG
                const sidebarAvatar = document.getElementById('sidebarAvatar');
                if (sidebarAvatar) {
                    sidebarAvatar.outerHTML = defaultSvgIcon;
                }
                // Mettre à jour le header (si présent)
                const headerAvatar = document.getElementById('headerAvatar');
                if (headerAvatar) {
                    headerAvatar.innerHTML = initialSingle;
                }
                // Mettre à jour le dropdown (si présent)
                const dropdownAvatar = document.getElementById('dropdownAvatar');
                if (dropdownAvatar) {
                    dropdownAvatar.innerHTML = initialSingle;
                }
                // Cacher le bouton supprimer
                if (elements.removeAvatarBtn) {
                    elements.removeAvatarBtn.style.display = 'none';
                }
            } else {
                showToast('error', result.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }

    // ========================================
    // Password Functions
    // ========================================
    function checkPasswordStrength() {
        const password = elements.newPassword.value;
        let strength = 0;
        let strengthClass = '';
        let strengthLabel = '';
        
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        
        switch (strength) {
            case 0:
            case 1:
                strengthClass = 'weak';
                strengthLabel = 'Faible';
                break;
            case 2:
                strengthClass = 'fair';
                strengthLabel = 'Moyen';
                break;
            case 3:
            case 4:
                strengthClass = 'good';
                strengthLabel = 'Bon';
                break;
            case 5:
                strengthClass = 'strong';
                strengthLabel = 'Fort';
                break;
        }
        
        if (elements.strengthFill) {
            elements.strengthFill.className = `strength-fill ${strengthClass}`;
        }
        if (elements.strengthText) {
            elements.strengthText.className = `strength-text ${strengthClass}`;
            elements.strengthText.textContent = password ? strengthLabel : '';
        }
        
        // Vérifier aussi le match si le champ de confirmation a une valeur
        if (elements.confirmPassword.value) {
            checkPasswordMatch();
        }
    }
    
    function checkPasswordMatch() {
        const newPwd = elements.newPassword.value;
        const confirmPwd = elements.confirmPassword.value;
        
        if (!confirmPwd) {
            elements.passwordMatch.textContent = '';
            elements.passwordMatch.style.color = '';
            return;
        }
        
        if (newPwd === confirmPwd) {
            elements.passwordMatch.textContent = '✓ Les mots de passe correspondent';
            elements.passwordMatch.style.color = 'var(--success-color)';
        } else {
            elements.passwordMatch.textContent = '✗ Les mots de passe ne correspondent pas';
            elements.passwordMatch.style.color = 'var(--error-color)';
        }
    }
    
    function togglePasswordVisibility(e) {
        const btn = e.currentTarget;
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');
        
        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = '';
        } else {
            input.type = 'password';
            eyeOpen.style.display = '';
            eyeClosed.style.display = 'none';
        }
    }
    
    async function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        // Validation
        if (newPassword.length < 8) {
            showToast('error', 'Le mot de passe doit contenir au moins 8 caractères');
            return;
        }
        
        if (!/[0-9]/.test(newPassword)) {
            showToast('error', 'Le mot de passe doit contenir au moins un chiffre');
            return;
        }
        
        if (!/[^a-zA-Z0-9]/.test(newPassword)) {
            showToast('error', 'Le mot de passe doit contenir au moins un caractère spécial');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('error', 'Les mots de passe ne correspondent pas');
            return;
        }
        
        try {
            const response = await fetch(`${API_USERS}?action=password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Mot de passe modifié avec succès');
                elements.passwordForm.reset();
                // Reset les indicateurs
                if (elements.strengthFill) elements.strengthFill.className = 'strength-fill';
                if (elements.strengthText) elements.strengthText.textContent = '';
                if (elements.passwordMatch) {
                    elements.passwordMatch.textContent = '';
                    elements.passwordMatch.style.color = '';
                }
            } else {
                showToast('error', result.message || 'Erreur lors du changement de mot de passe');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }

    // ========================================
    // Delete Account
    // ========================================
    function openDeleteModal() {
        if (elements.deleteAccountModal) {
            elements.deleteAccountModal.classList.add('active');
            elements.deleteConfirmPassword.value = '';
            elements.deleteConfirmPassword.focus();
        }
    }
    
    function closeDeleteModal() {
        if (elements.deleteAccountModal) {
            elements.deleteAccountModal.classList.remove('active');
        }
    }
    
    async function handleDeleteAccount() {
        const password = elements.deleteConfirmPassword.value;
        
        if (!password) {
            showToast('error', 'Veuillez entrer votre mot de passe');
            return;
        }
        
        try {
            // D'abord vérifier le mot de passe
            const verifyResponse = await fetch(`${API_USERS}?action=verify_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });
            
            const verifyResult = await verifyResponse.json();
            
            if (!verifyResult.success) {
                showToast('error', 'Mot de passe incorrect');
                return;
            }
            
            // Supprimer le compte
            const response = await fetch(`${API_USERS}?me`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Compte supprimé. Redirection...');
                setTimeout(() => {
                    window.location.href = 'login.php';
                }, 2000);
            } else {
                showToast('error', result.message || 'Erreur lors de la suppression du compte');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }

    // ========================================
    // Appearance Functions
    // ========================================
    function previewTheme() {
        const theme = elements.userTheme.value;
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    async function handleAppearanceSubmit(e) {
        e.preventDefault();
        
        const theme = elements.userTheme.value;
        const lang = elements.userLang.value;
        
        try {
            const response = await fetch(`${API_USERS}?action=preferences`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: theme,
                    lang_pref: lang
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Préférences enregistrées');
                // Appliquer le thème immédiatement
                document.documentElement.setAttribute('data-theme', theme);
                // Si la langue a changé, recharger la page
                const currentLang = document.documentElement.getAttribute('lang');
                if (currentLang !== lang) {
                    setTimeout(() => window.location.reload(), 500);
                }
            } else {
                showToast('error', result.message || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    async function handleBackgroundSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Veuillez sélectionner une image');
            return;
        }
        
        // Vérifier la taille (max 5 Mo)
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'L\'image ne doit pas dépasser 5 Mo');
            return;
        }
        
        const formData = new FormData();
        formData.append('background', file);
        
        try {
            const response = await fetch(`${API_USERS}?action=upload_background`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Image de fond mise à jour');
                // Mettre à jour la preview
                updateBackgroundPreview(result.data.url);
                // Appliquer au body
                applyBackgroundToPage(result.data.url);
                // Afficher le bouton supprimer
                if (elements.removeBackgroundBtn) {
                    elements.removeBackgroundBtn.style.display = '';
                }
            } else {
                showToast('error', result.message || 'Erreur lors de l\'upload');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    async function handleRemoveBackground() {
        if (!confirm('Supprimer l\'image de fond ?')) return;
        
        try {
            const response = await fetch(`${API_USERS}?action=delete_background`, {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Image de fond supprimée');
                // Remettre le placeholder
                if (elements.backgroundPreview) {
                    elements.backgroundPreview.innerHTML = `
                        <div class="background-placeholder" id="backgroundPlaceholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>Aucune image</span>
                        </div>
                    `;
                }
                // Retirer du body
                removeBackgroundFromPage();
                // Cacher le bouton supprimer
                if (elements.removeBackgroundBtn) {
                    elements.removeBackgroundBtn.style.display = 'none';
                }
            } else {
                showToast('error', result.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    function updateBackgroundPreview(url) {
        if (elements.backgroundPreview) {
            elements.backgroundPreview.innerHTML = `<img src="${url}" alt="Background" id="backgroundPreviewImg">`;
        }
    }
    
    function applyBackgroundToPage(url) {
        document.body.style.backgroundImage = `url('${url}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    }
    
    function removeBackgroundFromPage() {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundSize = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundAttachment = '';
        document.body.style.backgroundRepeat = '';
    }

    // ========================================
    // Privacy Functions
    // ========================================
    async function handlePrivacySubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            Visi_collec: parseInt(formData.get('Visi_collec')),
            show_mail: formData.get('show_mail') ? 1 : 0
        };
        
        try {
            const response = await fetch(`${API_USERS}?me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Paramètres de confidentialité enregistrés');
            } else {
                showToast('error', result.message || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }

    // ========================================
    // API Keys Management
    // ========================================
    const API_USER_KEYS = 'api/user-api-keys.php';
    let apiKeysInitialized = false; // Flag pour éviter les initialisations multiples
    
    /**
     * Initialise les gestionnaires pour les clés API
     */
    function initApiKeys() {
        const apiKeysList = document.getElementById('apiKeysList');
        if (!apiKeysList) {
            return;
        }
        
        // Éviter les initialisations multiples
        if (apiKeysList.dataset.initialized === 'true') {
            return;
        }
        
        const items = apiKeysList.querySelectorAll('.api-key-item');
        
        // Marquer comme initialisé
        apiKeysList.dataset.initialized = 'true';
        
        // Utiliser la délégation d'événements sur le conteneur
        apiKeysList.addEventListener('click', function(e) {
            // Clic sur header ou bouton toggle
            const header = e.target.closest('.api-key-header');
            if (header) {
                e.preventDefault();
                const item = header.closest('.api-key-item');
                if (item) {
                    toggleApiKeyForm(item);
                }
                return;
            }
            
            // Clic sur bouton supprimer
            const deleteBtn = e.target.closest('.api-key-delete');
            if (deleteBtn) {
                e.preventDefault();
                handleApiKeyDelete(e);
                return;
            }
            
            // Clic sur bouton tester
            const testBtn = e.target.closest('.api-key-test');
            if (testBtn) {
                e.preventDefault();
                handleApiKeyTest(e);
                return;
            }
            
            // Clic sur toggle visibilité
            const toggleVisBtn = e.target.closest('.toggle-visibility');
            if (toggleVisBtn) {
                e.preventDefault();
                e.stopPropagation();
                toggleApiKeyVisibility(e);
                return;
            }
        });
        
        // Soumission des formulaires
        apiKeysList.querySelectorAll('.api-key-form-inner').forEach(form => {
            if (!form.dataset.initialized) {
                form.dataset.initialized = 'true';
                form.addEventListener('submit', handleApiKeySubmit);
            }
        });
        
        // Ajouter curseur pointer sur les headers
        apiKeysList.querySelectorAll('.api-key-header').forEach(header => {
            header.style.cursor = 'pointer';
        });
    }
    
    /**
     * Toggle l'affichage du formulaire d'un item
     */
    function toggleApiKeyForm(item) {
        const form = item.querySelector('.api-key-form');
        const btn = item.querySelector('.api-key-toggle');
        const chevron = btn ? btn.querySelector('.icon-chevron') : null;
        
        if (!form) return;
        
        const isCurrentlyOpen = form.style.display !== 'none';
        
        // Fermer tous les autres formulaires
        document.querySelectorAll('.api-key-item').forEach(otherItem => {
            if (otherItem !== item) {
                const otherForm = otherItem.querySelector('.api-key-form');
                const otherBtn = otherItem.querySelector('.api-key-toggle');
                const otherChevron = otherBtn ? otherBtn.querySelector('.icon-chevron') : null;
                
                if (otherForm) {
                    otherForm.style.display = 'none';
                }
                if (otherBtn) {
                    otherBtn.dataset.expanded = 'false';
                    otherBtn.setAttribute('aria-expanded', 'false');
                }
                if (otherChevron) {
                    otherChevron.style.transform = 'rotate(0deg)';
                }
            }
        });
        
        // Basculer l'état actuel
        if (isCurrentlyOpen) {
            form.style.display = 'none';
            if (btn) {
                btn.dataset.expanded = 'false';
                btn.setAttribute('aria-expanded', 'false');
            }
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
        } else {
            form.style.display = 'block';
            if (btn) {
                btn.dataset.expanded = 'true';
                btn.setAttribute('aria-expanded', 'true');
            }
            if (chevron) {
                chevron.style.transform = 'rotate(180deg)';
            }
            
            // Focus sur le champ de saisie
            const input = form.querySelector('.api-key-input');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }
    
    /**
     * Tester une clé API
     */
    async function handleApiKeyTest(e) {
        const btn = e.target.closest('.api-key-test');
        const form = btn.closest('.api-key-form-inner');
        const item = btn.closest('.api-key-item');
        const providerName = btn.dataset.providerName;
        
        const apiKeyInput = form.querySelector('.api-key-input');
        const clientIdInput = form.querySelector('.client-id-input');
        
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        const clientId = clientIdInput ? clientIdInput.value.trim() : '';
        
        if (!apiKey) {
            showToast('warning', 'Veuillez saisir une clé API');
            return { valid: false };
        }
        
        // Désactiver le bouton pendant le test
        btn.disabled = true;
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-small"></span> Test...';
        
        try {
            const response = await fetch(`${API_USER_KEYS}?action=test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_name: providerName,
                    api_key: apiKey,
                    client_id: clientId
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.data.valid) {
                showToast('success', result.data.message || 'Clé API valide');
                // Mettre à jour visuellement
                updateTestStatus(item, true);
                return { valid: true };
            } else {
                const message = result.data?.message || result.error?.message || 'Clé API invalide';
                showToast('error', message);
                updateTestStatus(item, false);
                return { valid: false, message };
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
            return { valid: false };
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
    
    /**
     * Mettre à jour l'indicateur de statut du test
     */
    function updateTestStatus(item, isValid) {
        // Supprimer ancien indicateur
        const oldIndicator = item.querySelector('.test-status-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // Ajouter nouvel indicateur
        const indicator = document.createElement('span');
        indicator.className = `test-status-indicator ${isValid ? 'valid' : 'invalid'}`;
        indicator.innerHTML = isValid 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        
        const testBtn = item.querySelector('.api-key-test');
        if (testBtn) {
            testBtn.parentElement.insertBefore(indicator, testBtn);
        }
        
        // Supprimer l'indicateur après 5 secondes
        setTimeout(() => indicator.remove(), 5000);
    }
    
    /**
     * Ancienne fonction pour compatibilité (redirige vers toggleApiKeyForm)
     */
    function handleApiKeyToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        const item = e.currentTarget.closest('.api-key-item');
        if (item) {
            toggleApiKeyForm(item);
        }
    }
    
    /**
     * Soumission du formulaire de clé API
     */
    async function handleApiKeySubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const providerId = form.dataset.providerId;
        const item = form.closest('.api-key-item');
        const apiKeyInput = form.querySelector('.api-key-input');
        const clientIdInput = form.querySelector('.client-id-input');
        const testBtn = form.querySelector('.api-key-test');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        const clientId = clientIdInput ? clientIdInput.value.trim() : '';
        const providerName = testBtn ? testBtn.dataset.providerName : '';
        
        if (!apiKey) {
            showToast('warning', 'Veuillez saisir une clé API');
            return;
        }
        
        // Désactiver le bouton pendant le processus
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        
        // Étape 1: Tester la clé API avant de sauvegarder
        submitBtn.innerHTML = '<span class="spinner-small"></span> Vérification...';
        
        try {
            // Tester la clé
            const testResponse = await fetch(`${API_USER_KEYS}?action=test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_name: providerName,
                    api_key: apiKey,
                    client_id: clientId
                })
            });
            
            const testResult = await testResponse.json();
            
            // Si le test échoue, demander confirmation
            if (!testResult.success || !testResult.data.valid) {
                const errorMessage = testResult.data?.message || testResult.error?.message || 'Clé API invalide';
                updateTestStatus(item, false);
                
                // Demander si l'utilisateur veut quand même sauvegarder
                const saveAnyway = await confirmSaveInvalidKey(errorMessage);
                if (!saveAnyway) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }
            } else {
                updateTestStatus(item, true);
            }
            
            // Étape 2: Sauvegarder la clé
            submitBtn.innerHTML = '<span class="spinner-small"></span> Enregistrement...';
            
            const response = await fetch(API_USER_KEYS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    webapi_id: parseInt(providerId),
                    api_key: apiKey,
                    client_id: clientId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', result.data.message || 'Clé API enregistrée');
                
                // Mettre à jour l'UI pour montrer que la clé est configurée
                const item = form.closest('.api-key-item');
                item.classList.add('has-key');
                
                // Ajouter le badge "Configuré" s'il n'existe pas
                const header = item.querySelector('.api-key-info');
                if (header && !header.querySelector('.api-key-status')) {
                    const statusBadge = document.createElement('span');
                    statusBadge.className = 'api-key-status configured';
                    statusBadge.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Configuré
                    `;
                    header.appendChild(statusBadge);
                }
                
                // Ajouter le bouton de suppression s'il n'existe pas
                const actions = form.querySelector('.api-key-actions');
                if (actions && !actions.querySelector('.api-key-delete')) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.type = 'button';
                    deleteBtn.className = 'btn btn-danger btn-sm api-key-delete';
                    deleteBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Supprimer la clé
                    `;
                    deleteBtn.addEventListener('click', handleApiKeyDelete);
                    actions.appendChild(deleteBtn);
                }
                
                // Fermer le formulaire
                const toggleBtn = item.querySelector('.api-key-toggle');
                if (toggleBtn) {
                    toggleBtn.click();
                }
            } else {
                showToast('error', result.error?.message || 'Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    /**
     * Suppression d'une clé API
     */
    async function handleApiKeyDelete(e) {
        const btn = e.currentTarget;
        const item = btn.closest('.api-key-item');
        const providerId = item.dataset.providerId;
        const providerName = item.querySelector('.api-key-name').textContent;
        
        // Confirmation
        const confirmed = await confirmDelete(
            `Supprimer la clé API pour ${providerName} ?`,
            'Cette action est irréversible.'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch(`${API_USER_KEYS}?id=${providerId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', result.data.message || 'Clé API supprimée');
                
                // Mettre à jour l'UI
                item.classList.remove('has-key');
                
                // Supprimer le badge "Configuré"
                const statusBadge = item.querySelector('.api-key-status');
                if (statusBadge) {
                    statusBadge.remove();
                }
                
                // Supprimer le bouton de suppression
                btn.remove();
                
                // Vider les champs
                const apiKeyInput = item.querySelector('.api-key-input');
                const clientIdInput = item.querySelector('.client-id-input');
                if (apiKeyInput) apiKeyInput.value = '';
                if (clientIdInput) clientIdInput.value = '';
                
            } else {
                showToast('error', result.error?.message || 'Erreur lors de la suppression');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showToast('error', 'Erreur de connexion au serveur');
        }
    }
    
    /**
     * Toggle visibilité d'une clé API
     */
    function toggleApiKeyVisibility(e) {
        const btn = e.target.closest('.toggle-visibility');
        if (!btn) return;
        
        const wrapper = btn.closest('.input-with-actions');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input');
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');
        
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            if (eyeOpen) eyeOpen.style.display = 'none';
            if (eyeClosed) eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            if (eyeOpen) eyeOpen.style.display = 'block';
            if (eyeClosed) eyeClosed.style.display = 'none';
        }
    }
    
    /**
     * Demander confirmation pour sauvegarder une clé invalide
     */
    function confirmSaveInvalidKey(errorMessage) {
        return new Promise((resolve) => {
            if (window.ModalManager && typeof ModalManager.confirm === 'function') {
                ModalManager.confirm(
                    `La clé API semble invalide : "${errorMessage}"\n\nVoulez-vous quand même l'enregistrer ?`, 
                    { 
                        title: 'Clé API non validée',
                        type: 'warning',
                        confirmText: 'Enregistrer quand même',
                        cancelText: 'Annuler'
                    }
                ).then(resolve);
            } else {
                resolve(confirm(`La clé API semble invalide : "${errorMessage}"\n\nVoulez-vous quand même l'enregistrer ?`));
            }
        });
    }
    
    /**
     * Modal de confirmation de suppression
     */
    function confirmDelete(title, message) {
        return new Promise((resolve) => {
            // Utiliser ModalManager si disponible
            if (window.ModalManager && typeof ModalManager.confirm === 'function') {
                ModalManager.confirm(message, { 
                    title: title,
                    type: 'danger',
                    confirmText: 'Supprimer',
                    cancelText: 'Annuler'
                }).then(resolve);
            } else {
                // Fallback sur confirm natif
                resolve(confirm(`${title}\n\n${message}`));
            }
        });
    }

    // ========================================
    // Toast Notifications
    // ========================================
    function showToast(type, message) {
        // Chercher le toast container (peut être dans le shell principal)
        const container = elements.toastContainer || document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Event pour fermer
        toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
        
        // Auto-remove après 5s
        setTimeout(() => removeToast(toast), 5000);
    }
    
    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    // ========================================
    // Initialize
    // ========================================
    
    // Exposer init pour le router SPA
    window.SnowShelfAccount = { init };
    
    // Réinitialiser quand une page account est chargée via SPA
    document.addEventListener('pageLoaded', function(e) {
        if (e.detail && e.detail.page === 'account') {
            init();
        }
    });

    // Initialize on DOM Ready (pour le chargement direct)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Si le DOM est déjà prêt et qu'on est sur account
        if (document.querySelector('.account-page')) {
            init();
        }
    }
})();
