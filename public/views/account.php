<?php
/**
 * SnowShelf - Fragment Account (Mon compte)
 * Page de paramètres personnels : profil, sécurité, apparence
 */

// Variables disponibles: $userId, $userName, $userData, $pdo
// La fonction __() est disponible via i18n.php chargé par pages.php

// Charger les dépendances supplémentaires
require_once __DIR__ . '/../../core/SiteConfig.php';
require_once __DIR__ . '/../../core/UserService.php';

// Récupérer l'utilisateur et la config
$siteConfig = SiteConfig::getInstance();
$userService = new UserService($pdo);

$userFields = ['id', 'name', 'email', 'avatar_url', 'is_admin', 'is_premium', 'premium_until', 
               'created_at', 'newsletter', 'Visi_collec', 'Desc_Collec', 'show_mail', 'theme', 'lang_pref', 'background'];
$user = $userService->getUser($userId, $userFields);

// Section active (profil par défaut)
$section = $_GET['section'] ?? 'profile';
$validSections = ['profile', 'security', 'appearance', 'privacy', 'api_keys'];
if (!in_array($section, $validSections)) {
    $section = 'profile';
}

// Récupérer les thèmes disponibles
$availableThemes = $siteConfig->getAvailableThemes();

// Récupérer les fournisseurs nécessitant une clé API utilisateur
$apiProvidersStmt = $pdo->query("SELECT id, name, Name_UF, Type, Notes, CLIENT_ID_ON FROM Admin_webApi WHERE USER_API = 1 ORDER BY Type, Name_UF");
$apiProviders = $apiProvidersStmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les clés API de l'utilisateur
$userApiKeysStmt = $pdo->prepare("SELECT webapi_id, api_key, Cliend_ID_Token FROM users_api WHERE user_id = ?");
$userApiKeysStmt->execute([$userId]);
$userApiKeysRaw = $userApiKeysStmt->fetchAll(PDO::FETCH_ASSOC);
$userApiKeys = [];
foreach ($userApiKeysRaw as $key) {
    $userApiKeys[$key['webapi_id']] = [
        'api_key' => $key['api_key'],
        'client_id' => $key['Cliend_ID_Token']
    ];
}
?>

<div class="account-page">
    <!-- Navigation par onglets -->
    <div class="account-tabs">
        <a href="javascript:void(0)" class="account-tab <?= $section === 'profile' ? 'active' : '' ?>" data-section="profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span><?= htmlspecialchars(__('account.tab_profile')) ?></span>
        </a>
        <a href="javascript:void(0)" class="account-tab <?= $section === 'security' ? 'active' : '' ?>" data-section="security">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span><?= htmlspecialchars(__('account.tab_security')) ?></span>
        </a>
        <a href="javascript:void(0)" class="account-tab <?= $section === 'appearance' ? 'active' : '' ?>" data-section="appearance">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="21.17" y1="8" x2="12" y2="8"></line>
                <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
            </svg>
            <span><?= htmlspecialchars(__('account.tab_appearance')) ?></span>
        </a>
        <a href="javascript:void(0)" class="account-tab <?= $section === 'privacy' ? 'active' : '' ?>" data-section="privacy">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span><?= htmlspecialchars(__('account.tab_privacy')) ?></span>
        </a>
        <a href="javascript:void(0)" class="account-tab <?= $section === 'api_keys' ? 'active' : '' ?>" data-section="api_keys">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span><?= htmlspecialchars(__('account.tab_api_keys')) ?></span>
        </a>
    </div>

    <!-- Conteneur des sections -->
    <div class="account-sections-container">
        <!-- Section Profil -->
        <div class="account-section <?= $section === 'profile' ? 'active' : '' ?>" id="section-profile" data-section="profile">
            <div class="section-header">
                <div class="section-title">
                    <h2><?= htmlspecialchars(__('account.profile_title')) ?></h2>
                    <p class="section-subtitle"><?= htmlspecialchars(__('account.profile_subtitle')) ?></p>
                </div>
            </div>
            
            <div class="account-card">
                <!-- Avatar Section -->
                <div class="avatar-section">
                    <div class="avatar-container">
                        <div class="avatar-large" id="avatarPreview">
                            <?php if (!empty($user['avatar_url'])): ?>
                                <img src="<?= htmlspecialchars($user['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar" id="avatarImg">
                            <?php else: ?>
                                <span class="avatar-initials-large" id="avatarInitials"><?= strtoupper(substr($userName, 0, 2)) ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="avatar-actions">
                            <input type="file" id="avatarFile" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary btn-sm" id="changeAvatarBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <?= htmlspecialchars(__('account.change_avatar')) ?>
                            </button>
                            <?php if (!empty($user['avatar_url'])): ?>
                            <button type="button" class="btn btn-danger btn-sm" id="removeAvatarBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                <?= htmlspecialchars(__('common.delete')) ?>
                            </button>
                            <?php endif; ?>
                        </div>
                    </div>
                    <p class="avatar-hint"><?= htmlspecialchars(__('account.avatar_hint')) ?></p>
                </div>
                
                <!-- Profile Form -->
                <form id="profileForm" class="account-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="userName"><?= htmlspecialchars(__('auth.username')) ?></label>
                            <input type="text" id="userName" name="name" value="<?= htmlspecialchars($user['name']) ?>" 
                                   minlength="3" maxlength="50" required>
                            <small class="form-hint"><?= htmlspecialchars(__('account.username_hint')) ?></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="userEmail"><?= htmlspecialchars(__('auth.email')) ?></label>
                            <input type="email" id="userEmail" name="email" value="<?= htmlspecialchars($user['email']) ?>" required>
                            <small class="form-hint"><?= htmlspecialchars(__('account.email_hint')) ?></small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="userDesc"><?= htmlspecialchars(__('account.bio')) ?></label>
                        <textarea id="userDesc" name="Desc_Collec" rows="3" maxlength="500" 
                                  placeholder="<?= htmlspecialchars(__('account.bio_placeholder')) ?>"><?= htmlspecialchars($user['Desc_Collec'] ?? '') ?></textarea>
                        <small class="form-hint"><?= htmlspecialchars(__('account.bio_hint')) ?></small>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="newsletter" value="1" <?= ($user['newsletter'] ?? 0) ? 'checked' : '' ?>>
                            <span class="checkbox-custom"></span>
                            <?= htmlspecialchars(__('account.newsletter')) ?>
                        </label>
                        <small class="form-hint"><?= htmlspecialchars(__('account.newsletter_hint')) ?></small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <?= htmlspecialchars(__('common.save')) ?>
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Infos compte -->
            <div class="account-card account-info">
                <h3><?= htmlspecialchars(__('account.account_info')) ?></h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label"><?= htmlspecialchars(__('account.member_since')) ?></span>
                        <span class="info-value"><?= date('d/m/Y', strtotime($user['created_at'])) ?></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label"><?= htmlspecialchars(__('account.account_type')) ?></span>
                        <span class="info-value">
                            <?php 
                            $isAdmin = $user['is_admin'] ?? false;
                            $isPremium = ($user['is_premium'] ?? false) || $isAdmin;
                            if ($isAdmin): ?>
                                <span class="badge badge-admin"><?= htmlspecialchars(__('dashboard.role_admin')) ?></span>
                            <?php elseif ($isPremium): ?>
                                <span class="badge badge-premium"><?= htmlspecialchars(__('dashboard.role_premium')) ?></span>
                            <?php else: ?>
                                <span class="badge badge-member"><?= htmlspecialchars(__('dashboard.role_member')) ?></span>
                            <?php endif; ?>
                        </span>
                    </div>
                    <?php if ($isPremium && !$isAdmin && !empty($user['premium_until'])): ?>
                    <div class="info-item">
                        <span class="info-label"><?= htmlspecialchars(__('account.premium_until')) ?></span>
                        <span class="info-value"><?= date('d/m/Y', strtotime($user['premium_until'])) ?></span>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Section Sécurité -->
        <div class="account-section <?= $section === 'security' ? 'active' : '' ?>" id="section-security" data-section="security">
            <div class="section-header">
                <div class="section-title">
                    <h2><?= htmlspecialchars(__('account.security_title')) ?></h2>
                    <p class="section-subtitle"><?= htmlspecialchars(__('account.security_subtitle')) ?></p>
                </div>
            </div>
            
            <div class="account-card">
                <h3><?= htmlspecialchars(__('account.change_password')) ?></h3>
                <form id="passwordForm" class="account-form">
                    <div class="form-group">
                        <label for="currentPassword"><?= htmlspecialchars(__('account.current_password')) ?></label>
                        <div class="password-input-wrapper">
                            <input type="password" id="currentPassword" name="current_password" required autocomplete="current-password">
                            <button type="button" class="toggle-password" data-target="currentPassword">
                                <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="newPassword"><?= htmlspecialchars(__('account.new_password')) ?></label>
                        <div class="password-input-wrapper">
                            <input type="password" id="newPassword" name="new_password" required autocomplete="new-password"
                                   minlength="8" pattern="^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$">
                            <button type="button" class="toggle-password" data-target="newPassword">
                                <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                        <small class="form-hint"><?= htmlspecialchars(__('account.password_requirements')) ?></small>
                        
                        <!-- Password strength indicator -->
                        <div class="password-strength" id="passwordStrength">
                            <div class="strength-bar">
                                <div class="strength-fill" id="strengthFill"></div>
                            </div>
                            <span class="strength-text" id="strengthText"></span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword"><?= htmlspecialchars(__('account.confirm_password')) ?></label>
                        <div class="password-input-wrapper">
                            <input type="password" id="confirmPassword" name="confirm_password" required autocomplete="new-password">
                            <button type="button" class="toggle-password" data-target="confirmPassword">
                                <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                        <small class="form-hint" id="passwordMatch"></small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" id="changePasswordBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <?= htmlspecialchars(__('account.update_password')) ?>
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Zone dangereuse -->
            <div class="account-card danger-zone">
                <h3><?= htmlspecialchars(__('account.danger_zone')) ?></h3>
                <p class="danger-warning"><?= htmlspecialchars(__('account.danger_warning')) ?></p>
                
                <div class="danger-actions">
                    <button type="button" class="btn btn-danger" id="deleteAccountBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        <?= htmlspecialchars(__('account.delete_account')) ?>
                    </button>
                </div>
            </div>
        </div>

        <!-- Section Apparence -->
        <div class="account-section <?= $section === 'appearance' ? 'active' : '' ?>" id="section-appearance" data-section="appearance">
            <div class="section-header">
                <div class="section-title">
                    <h2><?= htmlspecialchars(__('account.appearance_title')) ?></h2>
                    <p class="section-subtitle"><?= htmlspecialchars(__('account.appearance_subtitle')) ?></p>
                </div>
            </div>
            
            <div class="account-card">
                <form id="appearanceForm" class="account-form">
                    <!-- Thème -->
                    <div class="form-group">
                        <label for="userTheme"><?= htmlspecialchars(__('common.theme')) ?></label>
                        <select id="userTheme" name="theme">
                            <?php foreach ($availableThemes as $themeKey => $themeInfo): ?>
                                <option value="<?= htmlspecialchars($themeKey) ?>" <?= ($user['theme'] ?? 'dark') === $themeKey ? 'selected' : '' ?>>
                                    <?= $themeInfo['icon'] ?> <?= htmlspecialchars($themeInfo['name']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <small class="form-hint"><?= htmlspecialchars(__('account.theme_hint')) ?></small>
                    </div>
                    
                    <!-- Langue -->
                    <div class="form-group">
                        <label for="userLang"><?= htmlspecialchars(__('common.language')) ?></label>
                        <select id="userLang" name="lang_pref">
                            <option value="fr" <?= ($user['lang_pref'] ?? 'fr') === 'fr' ? 'selected' : '' ?>>🇫🇷 Français</option>
                            <option value="en" <?= ($user['lang_pref'] ?? 'fr') === 'en' ? 'selected' : '' ?>>🇬🇧 English</option>
                        </select>
                        <small class="form-hint"><?= htmlspecialchars(__('account.lang_hint')) ?></small>
                    </div>
                    
                    <!-- Image de fond -->
                    <div class="form-group">
                        <label><?= htmlspecialchars(__('account.background')) ?></label>
                        <div class="background-upload-container">
                            <div class="background-preview" id="backgroundPreview">
                                <?php if (!empty($user['background'])): ?>
                                    <img src="<?= htmlspecialchars($user['background']) ?>?v=<?= time() ?>" alt="Background" id="backgroundPreviewImg">
                                <?php else: ?>
                                    <div class="background-placeholder" id="backgroundPlaceholder">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                        <span><?= htmlspecialchars(__('account.no_background')) ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <div class="background-actions">
                                <input type="file" id="backgroundFile" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary" id="selectBackgroundBtn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <?= htmlspecialchars(__('account.select_image')) ?>
                                </button>
                                <button type="button" class="btn btn-danger" id="removeBackgroundBtn" <?= empty($user['background']) ? 'style="display:none;"' : '' ?>>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <?= htmlspecialchars(__('common.delete')) ?>
                                </button>
                            </div>
                        </div>
                        <small class="form-hint"><?= htmlspecialchars(__('account.background_hint')) ?></small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <?= htmlspecialchars(__('common.save')) ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Section Confidentialité -->
        <div class="account-section <?= $section === 'privacy' ? 'active' : '' ?>" id="section-privacy" data-section="privacy">
            <div class="section-header">
                <div class="section-title">
                    <h2><?= htmlspecialchars(__('account.privacy_title')) ?></h2>
                    <p class="section-subtitle"><?= htmlspecialchars(__('account.privacy_subtitle')) ?></p>
                </div>
            </div>
            
            <div class="account-card">
                <form id="privacyForm" class="account-form">
                    <!-- Visibilité collection -->
                    <div class="form-group">
                        <label for="visiCollec"><?= htmlspecialchars(__('account.collection_visibility')) ?></label>
                        <select id="visiCollec" name="Visi_collec">
                            <option value="0" <?= ($user['Visi_collec'] ?? 0) == 0 ? 'selected' : '' ?>><?= htmlspecialchars(__('account.visibility_private')) ?></option>
                            <option value="1" <?= ($user['Visi_collec'] ?? 0) == 1 ? 'selected' : '' ?>><?= htmlspecialchars(__('account.visibility_friends')) ?></option>
                            <option value="2" <?= ($user['Visi_collec'] ?? 0) == 2 ? 'selected' : '' ?>><?= htmlspecialchars(__('account.visibility_public')) ?></option>
                        </select>
                        <small class="form-hint"><?= htmlspecialchars(__('account.visibility_hint')) ?></small>
                    </div>
                    
                    <!-- Afficher email -->
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="show_mail" value="1" <?= ($user['show_mail'] ?? 0) ? 'checked' : '' ?>>
                            <span class="checkbox-custom"></span>
                            <?= htmlspecialchars(__('account.show_email')) ?>
                        </label>
                        <small class="form-hint"><?= htmlspecialchars(__('account.show_email_hint')) ?></small>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            <?= htmlspecialchars(__('common.save')) ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Section Clés API -->
        <div class="account-section <?= $section === 'api_keys' ? 'active' : '' ?>" id="section-api_keys" data-section="api_keys">
            <div class="section-header">
                <div class="section-title">
                    <h2><?= htmlspecialchars(__('account.api_keys_title')) ?></h2>
                    <p class="section-subtitle"><?= htmlspecialchars(__('account.api_keys_subtitle')) ?></p>
                </div>
            </div>
            
            <div class="account-card">
                <p class="api-keys-intro"><?= htmlspecialchars(__('account.api_keys_intro')) ?></p>
                
                <?php if (empty($apiProviders)): ?>
                    <div class="empty-state">
                        <p><?= htmlspecialchars(__('account.no_api_keys_configured')) ?></p>
                    </div>
                <?php else: ?>
                    <div class="api-keys-list" id="apiKeysList">
                        <?php 
                        // Grouper par type
                        $providersByType = [];
                        foreach ($apiProviders as $provider) {
                            $type = $provider['Type'] ?? 'other';
                            if (!isset($providersByType[$type])) {
                                $providersByType[$type] = [];
                            }
                            $providersByType[$type][] = $provider;
                        }
                        
                        // Traductions des types
                        $typeLabels = [
                            'video_games' => __('web_search.type_video_games'),
                            'books' => __('web_search.type_books'),
                            'toys' => __('web_search.type_toys'),
                            'movies' => __('web_search.type_movies'),
                            'music' => __('web_search.type_music'),
                            'generic' => __('web_search.type_generic'),
                        ];
                        
                        foreach ($providersByType as $type => $providers): 
                            $typeLabel = $typeLabels[$type] ?? ucfirst($type);
                        ?>
                            <div class="api-keys-group">
                                <h4 class="api-keys-group-title"><?= htmlspecialchars($typeLabel) ?></h4>
                                
                                <?php foreach ($providers as $provider): 
                                    $providerId = $provider['id'];
                                    $currentKey = $userApiKeys[$providerId]['api_key'] ?? '';
                                    $currentClientId = $userApiKeys[$providerId]['client_id'] ?? '';
                                    // Une clé est considérée configurée seulement si elle n'est pas vide
                                    $hasKey = !empty(trim($currentKey));
                                    // Déterminer si ce fournisseur nécessite un Client ID (depuis la BDD)
                                    $needsClientId = ($provider['CLIENT_ID_ON'] ?? 0) == 1;
                                ?>
                                    <div class="api-key-item <?= $hasKey ? 'has-key' : '' ?>" data-provider-id="<?= $providerId ?>">
                                        <div class="api-key-header">
                                            <div class="api-key-info">
                                                <span class="api-key-name"><?= htmlspecialchars($provider['Name_UF']) ?></span>
                                                <?php if ($hasKey): ?>
                                                    <span class="api-key-status configured">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                        Configuré
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            <button type="button" class="btn btn-sm btn-secondary api-key-toggle" 
                                                    data-expanded="false" aria-expanded="false">
                                                <svg class="icon-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div class="api-key-form" style="display: none;">
                                            <form class="api-key-form-inner" data-provider-id="<?= $providerId ?>">
                                                <div class="form-group">
                                                    <label><?= htmlspecialchars(__('account.api_key_label')) ?></label>
                                                    <div class="input-with-actions">
                                                        <input type="password" 
                                                               name="api_key" 
                                                               class="api-key-input"
                                                               value="<?= htmlspecialchars($currentKey) ?>"
                                                               placeholder="<?= htmlspecialchars(__('account.api_key_placeholder')) ?>">
                                                        <button type="button" class="btn btn-icon toggle-visibility" title="Afficher/Masquer">
                                                            <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                            <svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <?php if ($needsClientId): ?>
                                                <div class="form-group">
                                                    <label><?= htmlspecialchars(__('account.client_id_label')) ?></label>
                                                    <input type="text" 
                                                           name="client_id" 
                                                           class="client-id-input"
                                                           value="<?= htmlspecialchars($currentClientId) ?>"
                                                           placeholder="<?= htmlspecialchars(__('account.client_id_placeholder')) ?>">
                                                </div>
                                                <?php endif; ?>
                                                
                                                <?php if (!empty($provider['Notes'])): ?>
                                                <div class="api-key-notes">
                                                    <small><?= htmlspecialchars($provider['Notes']) ?></small>
                                                </div>
                                                <?php endif; ?>
                                                
                                                <div class="api-key-actions">
                                                    <button type="button" class="btn btn-secondary btn-sm api-key-test" data-provider-name="<?= htmlspecialchars($provider['name']) ?>">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                        </svg>
                                                        <?= htmlspecialchars(__('account.api_key_test')) ?>
                                                    </button>
                                                    <button type="submit" class="btn btn-primary btn-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                            <polyline points="7 3 7 8 15 8"></polyline>
                                                        </svg>
                                                        <?= htmlspecialchars(__('common.save')) ?>
                                                    </button>
                                                    <?php if ($hasKey): ?>
                                                    <button type="button" class="btn btn-danger btn-sm api-key-delete">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                        <?= htmlspecialchars(__('account.api_key_remove')) ?>
                                                    </button>
                                                    <?php endif; ?>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Modal de confirmation suppression compte -->
<div class="modal" id="deleteAccountModal">
    <div class="modal-backdrop"></div>
    <div class="modal-container modal-danger">
        <div class="modal-header">
            <h3><?= htmlspecialchars(__('account.delete_account_title')) ?></h3>
            <button type="button" class="modal-close" id="deleteModalClose">&times;</button>
        </div>
        <div class="modal-body">
            <div class="danger-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            </div>
            <p><?= htmlspecialchars(__('account.delete_account_warning')) ?></p>
            <div class="form-group">
                <label for="deleteConfirmPassword"><?= htmlspecialchars(__('account.enter_password_confirm')) ?></label>
                <input type="password" id="deleteConfirmPassword" placeholder="<?= htmlspecialchars(__('auth.password')) ?>">
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="deleteModalCancel"><?= htmlspecialchars(__('common.cancel')) ?></button>
            <button type="button" class="btn btn-danger" id="deleteModalConfirm">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <?= htmlspecialchars(__('account.confirm_delete')) ?>
            </button>
        </div>
    </div>
</div>
