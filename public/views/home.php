<?php
/**
 * SnowShelf - Fragment Home (Dashboard)
 * Page d'accueil du tableau de bord
 */

// Variables disponibles: $userId, $userName, $userData, $pdo
// La fonction __() est disponible via i18n.php chargé par pages.php
?>

<div class="dashboard-home">
    <div class="welcome-section">
        <h1><?= htmlspecialchars(__('dashboard.welcome')) ?>, <?= htmlspecialchars($userName) ?> !</h1>
        <p class="welcome-subtitle"><?= htmlspecialchars(__('dashboard.subtitle')) ?></p>
    </div>

    <div class="stats-grid">
        <?php
        // Statistiques rapides (placeholder - à implémenter avec vraies données)
        $stats = [
            [
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
                'label' => __('dashboard.total_books'),
                'value' => '0',
                'color' => 'primary'
            ],
            [
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
                'label' => __('dashboard.wishlist_count'),
                'value' => '0',
                'color' => 'danger'
            ],
            [
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
                'label' => __('dashboard.reading_progress'),
                'value' => '0',
                'color' => 'success'
            ],
            [
                'icon' => '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
                'label' => __('dashboard.this_month'),
                'value' => '0',
                'color' => 'warning'
            ]
        ];
        ?>
        
        <?php foreach ($stats as $stat): ?>
        <div class="stat-card stat-<?= $stat['color'] ?>">
            <div class="stat-icon">
                <?= $stat['icon'] ?>
            </div>
            <div class="stat-info">
                <span class="stat-value"><?= $stat['value'] ?></span>
                <span class="stat-label"><?= htmlspecialchars($stat['label']) ?></span>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <div class="dashboard-grid">
        <div class="dashboard-card recent-activity">
            <div class="card-header">
                <h2>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <?= htmlspecialchars(__('dashboard.recent_activity')) ?>
                </h2>
            </div>
            <div class="card-body">
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <p><?= htmlspecialchars(__('dashboard.no_activity')) ?></p>
                    <span class="empty-hint"><?= htmlspecialchars(__('dashboard.start_adding')) ?></span>
                </div>
            </div>
        </div>

        <div class="dashboard-card quick-actions">
            <div class="card-header">
                <h2>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <?= htmlspecialchars(__('dashboard.quick_actions')) ?>
                </h2>
            </div>
            <div class="card-body">
                <div class="quick-actions-grid">
                    <button class="quick-action-btn" data-page="scan">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                            <line x1="7" y1="12" x2="17" y2="12"></line>
                        </svg>
                        <span><?= htmlspecialchars(__('dashboard.scan_book')) ?></span>
                    </button>
                    <button class="quick-action-btn" data-page="collection">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span><?= htmlspecialchars(__('dashboard.add_manual')) ?></span>
                    </button>
                    <button class="quick-action-btn" data-page="explore">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <span><?= htmlspecialchars(__('dashboard.search_books')) ?></span>
                    </button>
                    <button class="quick-action-btn" data-page="stats">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span><?= htmlspecialchars(__('dashboard.view_stats')) ?></span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="dashboard-card reading-goals">
        <div class="card-header">
            <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <?= htmlspecialchars(__('dashboard.reading_goals')) ?>
            </h2>
        </div>
        <div class="card-body">
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
                <p><?= htmlspecialchars(__('dashboard.no_goals')) ?></p>
                <span class="empty-hint"><?= htmlspecialchars(__('dashboard.set_goals')) ?></span>
            </div>
        </div>
    </div>
</div>
