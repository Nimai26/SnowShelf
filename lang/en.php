<?php
/**
 * SnowShelf - English Translation File
 * 
 * Structure: associative array with hierarchical keys
 * Convention: keys in English, translated values
 */

return [
    // Language meta-information
    '_meta' => [
        'code' => 'en',
        'name' => 'English',
        'flag' => '🇬🇧',
        'direction' => 'ltr', // left-to-right
    ],

    // ============================================
    // LANDING / TAGLINE
    // ============================================
    'landing' => [
        'tagline' => 'Your collection, elevated.',
        'subtitle' => 'Organize, catalog and share your collector treasures.',
        'feature_catalog' => 'Easy cataloging',
        'feature_catalog_desc' => 'Video games, vinyls, books, figurines... All in one place.',
        'feature_track' => 'Track your collection',
        'feature_track_desc' => 'Estimated value, statistics and complete history.',
        'feature_share' => 'Share with the community',
        'feature_share_desc' => 'Show off your rare pieces and discover others.',
        'feature_scan' => 'Smart scanning',
        'feature_scan_desc' => 'Add items by simply scanning the barcode.',
    ],

    // ============================================
    // COMMON (used across multiple pages)
    // ============================================
    'common' => [
        'app_name' => 'SnowShelf',
        'loading' => 'Loading...',
        'save' => 'Save',
        'save_all' => 'Save All',
        'cancel' => 'Cancel',
        'delete' => 'Delete',
        'edit' => 'Edit',
        'add' => 'Add',
        'search' => 'Search',
        'confirm' => 'Confirm',
        'back' => 'Back',
        'next' => 'Next',
        'previous' => 'Previous',
        'yes' => 'Yes',
        'no' => 'No',
        'close' => 'Close',
        'submit' => 'Submit',
        'reset' => 'Reset',
        'actions' => 'Actions',
        'options' => 'Options',
        'settings' => 'Settings',
        'language' => 'Language',
        'theme' => 'Theme',
        'all' => 'All',
        'active' => 'Active',
        'inactive' => 'Inactive',
        'coming_soon' => 'Coming soon',
        'work_in_progress' => 'This feature is under development.',
        
        // Footer
        'made_with' => 'Made with',
        'by' => 'by',
        'design_by' => 'Design by',
    ],

    // ============================================
    // AUTHENTICATION
    // ============================================
    'auth' => [
        'login' => 'Login',
        'logout' => 'Logout',
        'register' => 'Register',
        'username' => 'Username',
        'email' => 'Email address',
        'password' => 'Password',
        'password_confirm' => 'Confirm password',
        'remember_me' => 'Remember me',
        'forgot_password' => 'Forgot password?',
        'reset_password' => 'Reset password',
        'no_account' => 'Don\'t have an account?',
        'have_account' => 'Already have an account?',
        'login_success' => 'Login successful!',
        'logout_success' => 'Logout successful.',
        'register_success' => 'Registration successful! You can now log in.',
    ],

    // ============================================
    // API
    // ============================================
    'api' => [
        'unauthorized' => 'Authentication required.',
        'forbidden' => 'Access forbidden.',
        'not_found' => 'Resource not found.',
        'method_not_allowed' => 'Method not allowed.',
        'server_error' => 'Server error.',
        'invalid_request' => 'Invalid request.',
    ],

    // ============================================
    // ERRORS
    // ============================================
    'errors' => [
        'generic' => 'An error occurred.',
        'not_found' => 'Page not found.',
        'unauthorized' => 'Unauthorized access.',
        'forbidden' => 'Access forbidden.',
        'server_error' => 'Server error.',
        'validation' => 'Please check the form fields.',
        'credentials' => 'Invalid credentials.',
        'empty_fields' => 'Please fill in all fields.',
        'email_invalid' => 'Invalid email address.',
        'password_mismatch' => 'Passwords do not match.',
        'password_weak' => 'Password is too weak.',
        'username_taken' => 'This username is already taken.',
        'email_taken' => 'This email address is already in use.',
        'session_expired' => 'Your session has expired. Please log in again.',
        'email_not_verified' => 'Please verify your email address before logging in.',
    ],

    // ============================================
    // SUCCESS
    // ============================================
    'success' => [
        'saved' => 'Saved successfully.',
        'deleted' => 'Deleted successfully.',
        'updated' => 'Updated successfully.',
        'created' => 'Created successfully.',
        'password_reset' => 'Password reset successfully.',
        'email_sent' => 'Email sent successfully.',
        'email_verified' => 'Your email has been verified successfully! You can now log in.',
        'logout' => 'You have been logged out successfully.',
        'email_changed' => 'Your email address has been changed. Please log in with your new email.',
        'password_changed' => 'Your password has been changed. Please log in again.',
        'account_deleted' => 'Your account has been deleted successfully.',
    ],

    // ============================================
    // NAVIGATION / MENU
    // ============================================
    'nav' => [
        'home' => 'Home',
        'dashboard' => 'Dashboard',
        'collections' => 'Collections',
        'categories' => 'Categories',
        'items' => 'Items',
        'profile' => 'Profile',
        'settings' => 'Settings',
        'admin' => 'Administration',
        'help' => 'Help',
        'about' => 'About',
    ],

    // ============================================
    // COLLECTIONS
    // ============================================
    'collections' => [
        'title' => 'My Collections',
        'create' => 'New collection',
        'edit' => 'Edit collection',
        'delete' => 'Delete collection',
        'empty' => 'No collections yet.',
        'item_count' => '{count} item|{count} items',
        'total_value' => 'Total value',
        'last_updated' => 'Last updated',
    ],

    // ============================================
    // PRIMARY TYPES (collection)
    // ============================================
    'primary_types' => [
        'books' => 'Books',
        'video_games' => 'Video Games',
        'music' => 'Music',
        'movies' => 'Movies',
        'series' => 'Series',
        'toys_fig' => 'Figurines & Toys',
        'toys_construct' => 'Construction Toys',
        'divers' => 'Miscellaneous',
        'board_games' => 'Board Games',
        'trading_cards' => 'Trading Cards',
        'sticker_albums' => 'Sticker Albums',
    ],

    // ============================================
    // ITEM CATEGORIES
    // ============================================
    'categories' => [
        'video_games' => 'Video Games',
        'board_games' => 'Board Games',
        'consoles' => 'Consoles & Systems',
        'toys' => 'Toys',
        'books' => 'Books',
        'trading_cards' => 'Trading Cards',
        'vhs' => 'VHS',
        'dvd' => 'DVD',
        'bluray' => 'Blu-ray',
        'laserdisc' => 'LaserDisc',
        'vinyl' => 'Vinyl Records',
        'cd' => 'Audio CD',
        'cassette' => 'Audio Cassette',
        'sticker_albums' => 'Sticker Albums',
    ],

    // ============================================
    // ITEMS
    // ============================================
    'items' => [
        'title' => 'Title',
        'name' => 'Name',
        'description' => 'Description',
        'condition' => 'Condition',
        'condition_new' => 'New',
        'condition_like_new' => 'Like new',
        'condition_good' => 'Good',
        'condition_fair' => 'Fair',
        'condition_poor' => 'Poor',
        'purchase_date' => 'Purchase date',
        'purchase_price' => 'Purchase price',
        'current_value' => 'Current value',
        'quantity' => 'Quantity',
        'location' => 'Location',
        'notes' => 'Notes',
        'barcode' => 'Barcode',
        'images' => 'Images',
        'add_image' => 'Add image',
    ],

    // ============================================
    // USER PROFILE
    // ============================================
    'profile' => [
        'title' => 'My Profile',
        'edit' => 'Edit profile',
        'avatar' => 'Avatar',
        'change_avatar' => 'Change avatar',
        'display_name' => 'Display name',
        'bio' => 'Biography',
        'member_since' => 'Member since',
        'change_password' => 'Change password',
        'current_password' => 'Current password',
        'new_password' => 'New password',
    ],

    // ============================================
    // SETTINGS
    // ============================================
    'settings' => [
        'title' => 'Settings',
        'appearance' => 'Appearance',
        'language' => 'Language',
        'theme' => 'Theme',
        'notifications' => 'Notifications',
        'privacy' => 'Privacy',
        'security' => 'Security',
        'export_data' => 'Export my data',
        'delete_account' => 'Delete my account',
    ],

    // ============================================
    // DATES AND TIMES
    // ============================================
    'datetime' => [
        'today' => 'Today',
        'yesterday' => 'Yesterday',
        'tomorrow' => 'Tomorrow',
        'days_ago' => '{count} day ago|{count} days ago',
        'hours_ago' => '{count} hour ago|{count} hours ago',
        'minutes_ago' => '{count} minute ago|{count} minutes ago',
        'just_now' => 'Just now',
    ],

    // ============================================
    // EMAILS
    // ============================================
    'emails' => [
        // Email verification
        'verification_subject' => 'Confirm your email address - SnowShelf',
        'verification_greeting' => 'Hello',
        'verification_intro' => 'Thank you for signing up on SnowShelf! We\'re excited to have you.',
        'verification_instruction' => 'To activate your account and access all features, please confirm your email address by clicking the button below:',
        'verification_button' => 'Confirm my email address',
        'verification_expire' => 'This confirmation link expires in 24 hours.',
        'verification_ignore' => 'If you didn\'t create an account on SnowShelf, you can safely ignore this email.',
        
        // Password reset
        'reset_subject' => 'Reset your password - SnowShelf',
        'reset_greeting' => 'Hello',
        'reset_intro' => 'You have requested to reset your SnowShelf password.',
        'reset_instruction' => 'Click the button below to set a new password:',
        'reset_button' => 'Reset my password',
        'reset_expire' => 'This link expires in 1 hour for security reasons.',
        'reset_ignore' => 'If you didn\'t request this reset, ignore this email. Your current password will remain unchanged.',
        
        // Common footer
        'footer_text' => 'This email was sent automatically by SnowShelf. Please do not reply.',
    ],

    // ============================================
    // FORM VALIDATION
    // ============================================
    'validation' => [
        'required' => 'This field is required.',
        'email_format' => 'Please enter a valid email address.',
        'password_min_length' => 'Password must be at least {min} characters long.',
        'password_needs_number' => 'Password must contain at least one number.',
        'password_needs_special' => 'Password must contain at least one special character (!@#$%^&*...).',
        'password_match' => 'Passwords do not match.',
        'username_min_length' => 'Username must be at least {min} characters long.',
        'username_max_length' => 'Username cannot exceed {max} characters.',
        'username_format' => 'Username can only contain letters, numbers, hyphens and underscores.',
        'terms_required' => 'You must accept the terms of service.',
    ],

    // ============================================
    // REGISTRATION PAGE
    // ============================================
    'register' => [
        'title' => 'Create an account',
        'subtitle' => 'Join the SnowShelf community',
        'username_placeholder' => 'Choose a username',
        'email_placeholder' => 'Your email address',
        'password_placeholder' => 'Create a secure password',
        'password_confirm_placeholder' => 'Confirm your password',
        'password_requirements' => 'Min. 8 characters, 1 number, 1 special character',
        'terms_agree' => 'I agree to the',
        'terms_link' => 'terms of service',
        'privacy_and' => 'and the',
        'privacy_link' => 'privacy policy',
        'submit_button' => 'Create my account',
        'already_account' => 'Already registered?',
        'login_link' => 'Log in',
        'success_title' => 'Registration successful!',
        'success_message' => 'A confirmation email has been sent to your address. Please click the link to activate your account.',
        'check_spam' => 'Remember to check your spam folder if you don\'t receive anything.',
    ],

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    'verify_email' => [
        'title' => 'Email verification',
        'success_title' => 'Email verified!',
        'success_message' => 'Your email address has been successfully confirmed. You can now log in.',
        'error_title' => 'Invalid link',
        'error_message' => 'This verification link is invalid or has expired.',
        'error_already_verified' => 'Good news! Your account is already activated. You can log in directly.',
        'error_link_used' => 'This link has already been used. If you verified your email, your account is active.',
        'login_button' => 'Log in',
        'resend_link' => 'Resend confirmation email',
    ],

    // ============================================
    // LEGAL PAGES
    // ============================================
    'legal' => [
        'terms_title' => 'Terms of Service',
        'privacy_title' => 'Privacy Policy',
        'last_updated' => 'Last updated',
        'all_rights_reserved' => 'All rights reserved.',
        'accept_terms' => 'I accept the',
        'and' => 'and the',
    ],

    // ============================================
    // DASHBOARD
    // ============================================
    'dashboard' => [
        'title' => 'Dashboard',
        'home' => 'Home',
        'my_collection' => 'My collection',
        'scan' => 'Scan',
        'wishlist' => 'Wishlist',
        'explore' => 'Explore',
        'community' => 'Community',
        'stats' => 'Statistics',
        'settings' => 'Settings',
        'admin' => 'Administration',
        'toggle_menu' => 'Toggle menu',
        'search_placeholder' => 'Search your collection...',
        'quick_add' => 'Quick add item',
        'quick_add_category' => 'Quick add category',
        'notifications' => 'Notifications',
        'profile' => 'My profile',
        'logout' => 'Log out',
        'role_admin' => 'Admin',
        'role_premium' => 'Premium',
        'role_member' => 'Member',
        'welcome' => 'Welcome',
        'welcome_subtitle' => 'Here\'s an overview of your collection.',
        'subtitle' => 'Here\'s an overview of your collection',
        'empty_collection_title' => 'Your collection is empty',
        'empty_collection_desc' => 'Start adding items by scanning a barcode or adding them manually.',
        'start_scanning' => 'Start scanning',
        
        // Dashboard Home SPA
        'total_books' => 'Items',
        'wishlist_count' => 'Wishlist',
        'reading_progress' => 'On order',
        'this_month' => 'This month',
        'recent_activity' => 'Recent activity',
        'no_activity' => 'No recent activity',
        'start_adding' => 'Start by adding items to your collection',
        'quick_actions' => 'Quick actions',
        'scan_book' => 'Scan an item',
        'add_manual' => 'Add manually',
        'search_books' => 'Search an item',
        'view_stats' => 'View statistics',
        'reading_goals' => 'Goals',
        'no_goals' => 'No goals set',
        'set_goals' => 'Set your goals in settings',
        
        // Categories menu
        'categories' => 'Categories',
    ],

    // ============================================
    // CATEGORIES MANAGEMENT
    // ============================================
    'categories_page' => [
        'title' => 'Categories Management',
        'subtitle' => 'Browse and manage your collection categories.',
        
        // Header and search
        'search_placeholder' => 'Search a category...',
        'add_category' => 'New category',
        
        // Filters
        'filter_all' => 'All',
        'filter_default' => 'Default',
        'filter_public' => 'Public',
        'filter_mine' => 'My categories',
        'show_default' => 'Show default categories',
        'show_public' => 'Show public categories',
        
        // Category info
        'default_badge' => 'Default',
        'public_badge' => 'Public',
        'private_badge' => 'Private',
        'owner' => 'Created by',
        'items_count' => '{count} item|{count} items',
        'no_items' => 'No items',
        'created_at' => 'Created on',
        
        // Actions
        'view' => 'View',
        'view_import' => 'View / Import',
        'edit' => 'Edit',
        'delete' => 'Delete',
        'copy' => 'Copy',
        'import' => 'Import',
        'save' => 'Save',
        'make_public' => 'Make public',
        'make_private' => 'Make private',
        'close' => 'Close',
        'use_category' => 'Use this category',
        
        // Form
        'form_title_add' => 'New category',
        'form_title_edit' => 'Edit category',
        'form_title_view' => 'Category details',
        'field_name' => 'Category name',
        'field_name_placeholder' => 'E.g.: Retro video games',
        'field_description' => 'Description',
        'field_description_placeholder' => 'Describe this category...',
        'field_notes' => 'Personal notes',
        'field_notes_placeholder' => 'Notes visible only to you...',
        'field_icon' => 'Icon',
        'field_icon_hint' => 'Click or drag & drop an image (PNG, JPG, GIF, WebP, SVG, AVIF - max 6 MB)',
        'field_icon_upload' => 'Click or drop an image',
        'error_invalid_image' => 'Invalid image format (PNG, JPG, GIF, WebP, SVG, AVIF)',
        'error_file_too_large' => 'File too large (max 6 MB)',
        'field_visible' => 'Public category',
        'field_visible_hint' => 'Allows other premium users to see and use this category.',
        'field_owner' => 'Owner',
        'field_original_creator' => 'Created by',
        'field_items_count' => 'Items in this category',
        'field_created_at' => 'Creation date',
        'field_visibility' => 'Visibility',
        'field_id' => 'ID',
        'visibility_public' => 'Public - Visible to all Premium users',
        'visibility_private' => 'Private - Visible only to you',
        'visibility_default' => 'System category - Available to everyone',
        'no_description' => 'No description',
        'no_notes' => 'No notes',
        'system_category' => 'System category',
        
        // Admin: Default category
        'field_is_default' => 'System category (Admin)',
        'is_default_label' => 'Default category',
        'is_default_hint' => 'Accessible to all users. Files will be transferred automatically.',
        'is_default_warning' => 'Warning: Making this a "default" category will detach it from its current owner.',
        
        // Parent/child category relations
        'section_hierarchy' => 'Hierarchy',
        'section_parents' => 'Parent categories',
        'field_parents' => 'Parent categories',
        'field_parents_hint' => 'Categories that will be automatically added when this category is selected for an item.',
        'field_children' => 'Subcategories',
        'field_children_hint' => 'Categories that have this category as a parent (read-only)',
        'children_readonly_hint' => 'Subcategories are managed via the "parent categories" field of those categories.',
        'no_parents' => 'No parent category',
        'no_children' => 'No subcategories',
        'parents_placeholder' => 'Search for a parent category...',
        'search_category' => 'Search a category...',
        'add_parent' => 'Add parent category',
        'remove_parent' => 'Remove',
        'no_results' => 'No results',
        // Default links import
        'show_default_suggestions' => 'Show default suggestions',
        'default_links_hint' => 'These links are suggested by default. Click on a link to import it.',
        'import_all_defaults' => 'Import all default links',
        'link_imported' => 'Link imported',
        'link_already_exists' => 'This link already exists',
        'defaults_imported' => '%d default link(s) imported',
        'error_import' => 'Error importing links',
        // Admin default links section
        'admin_default_links_title' => 'Default links (for all users)',
        'admin_default_links_hint' => 'These links will be suggested by default to all users of this category.',
        'no_default_links' => 'No default links configured',
        'search_default_parent' => 'Add a default link...',
        
        // Grades (physical condition of items)
        'section_grades' => 'Physical Condition',
        'field_grades' => 'Available grades',
        'field_grades_hint' => 'Grades (physical conditions) applicable to items in this category',
        'grades_available' => 'Enable the grades applicable to items in this category',
        'no_grades' => 'No grades configured',
        'grade_enabled' => 'Enabled',
        'grade_disabled' => 'Disabled',
        
        // Grades management (Premium)
        'grades_default_section' => 'Default grades',
        'grades_custom_section' => 'My custom grades',
        'grades_show_default' => 'Show default grades',
        'grades_hide_default' => 'Hide default grades',
        'grades_create' => 'Create a grade',
        'grades_create_new' => 'New grade',
        'grades_edit' => 'Edit',
        'grades_delete' => 'Delete',
        'grades_name' => 'Grade name',
        'grades_name_placeholder' => 'e.g.: Like new, Collector edition...',
        'grades_description' => 'Description (optional)',
        'grades_description_placeholder' => 'Brief description of this grade',
        'grades_confirm_delete' => 'Delete this grade?',
        'grades_confirm_delete_message' => 'This grade will be removed from all items that use it. The items will keep their other data.',
        'grades_created' => 'Grade created successfully.',
        'grades_updated' => 'Grade updated successfully.',
        'grades_deleted' => 'Grade deleted successfully.',
        'grades_premium_only' => 'Premium Feature',
        'grades_premium_message' => 'Upgrade to Premium to create your own custom grades and personalize the condition tracking of your collection!',
        'grades_usage_count' => 'Used on %d item(s)',
        'grades_none_custom' => 'You have not created any custom grades yet.',
        'grades_in_use_warning' => 'Warning: this grade is used on %d item(s). They will lose this grade.',
        
        // Media
        'section_media' => 'Media',
        'section_images' => 'Images',
        'section_videos' => 'Videos',
        'section_audio' => 'Audio',
        'section_documents' => 'Documents',
        'images_count' => '%d image(s)',
        'videos_count' => '%d video(s)',
        'audios_count' => '%d audio(s)',
        'documents_count' => '%d document(s)',
        'no_media' => 'No media',
        'media_coming_soon' => 'Media management coming soon',
        'media_tab_images' => 'Images',
        'media_tab_videos' => 'Videos',
        'media_tab_audio' => 'Audio',
        'media_tab_documents' => 'Documents',
        'media_hint_images' => 'Add photos of your collection. Accepted formats: JPG, PNG, GIF, WebP. Images can be cropped before upload.',
        'media_hint_videos' => 'Add videos (unboxing, presentations...). Accepted formats: MP4, WebM, AVI, MKV. A thumbnail will be generated automatically.',
        'media_hint_audio' => 'Add audio files (music, sound effects, voice comments...). Accepted formats: MP3, WAV, OGG, FLAC. Direct playback in the interface.',
        'media_hint_documents' => 'Add documents (manuals, invoices, certificates...). Accepted formats: PDF, DOC, XLS, TXT, ZIP. Downloadable from the interface.',
        'take_photo' => 'Take a photo',
        // Media lightbox
        'prev_image' => 'Previous image',
        'next_image' => 'Next image',
        'video_not_supported' => 'Your browser does not support video playback.',
        
        // Copy
        'copy_success' => 'Category copied successfully.',
        
        // Messages
        'confirm_delete' => 'Delete this category?',
        'confirm_delete_message' => 'This action is irreversible. Associated items will not be deleted but will lose this category.',
        'created_success' => 'Category created successfully.',
        'updated_success' => 'Category updated.',
        'deleted_success' => 'Category deleted.',
        'copied_success' => 'Category copied successfully.',
        'error_name_required' => 'Name is required.',
        'error_name_exists' => 'A category with this name already exists.',
        'error_circular_reference' => 'A category cannot be its own subcategory.',
        
        // Empty states
        'empty_title' => 'No categories found',
        'empty_message' => 'No category matches your search.',
        'empty_no_categories' => 'You don\'t have any custom categories yet.',
        
        // Premium
        'premium_banner_title' => 'Unlock custom categories',
        'premium_banner_message' => 'Go Premium to create your own categories and access public categories from the community!',
        'premium_button' => 'Go Premium',
        'free_info' => 'As a free user, you have view-only access to default categories.',
        'premium_info' => 'As a Premium user, you can create your own categories and access those shared by the community.',
        
        // Permissions
        'readonly' => 'View only',
        'readonly_default' => 'Default categories cannot be modified.',
        'readonly_other' => 'This category belongs to another user.',
    ],

    // ============================================
    // ADMINISTRATION
    // ============================================
    'admin' => [
        'title' => 'Administration',
        'users' => 'Users',
        'users_management' => 'User Management',
        'users_subtitle' => 'Manage user accounts, roles and permissions.',
        'statistics' => 'Statistics',
        'stats_subtitle' => 'Overview of site metrics and performance.',
        'logs' => 'Logs',
        'logs_subtitle' => 'View activity and error logs.',
        'system_settings' => 'System Settings',
        'settings_subtitle' => 'Configure global application settings.',
        
        // Users table
        'add_user' => 'Add user',
        'edit_user' => 'Edit user',
        'search_users' => 'Search for a user...',
        'all_roles' => 'All roles',
        'filter_admins' => 'Administrators',
        'filter_premium' => 'Premium',
        'filter_members' => 'Members',
        'sort_id' => 'Sort by ID',
        'sort_name' => 'Sort by name',
        'sort_email' => 'Sort by email',
        'sort_date' => 'Sort by date',
        'col_user' => 'User',
        'col_email' => 'Email',
        'col_role' => 'Role',
        'col_status' => 'Status',
        'col_created' => 'Registered',
        
        // Form
        'is_admin' => 'Administrator',
        'is_premium' => 'Premium',
        'email_verified' => 'Email verified',
        'password_placeholder' => 'Leave empty to keep current',
        'password_hint' => 'Min. 8 characters, 1 number, 1 special character',
        
        // Delete
        'confirm_delete' => 'Confirm deletion',
        'delete_user_confirm' => 'Are you sure you want to delete this user? This action cannot be undone.',
        'delete_config_confirm' => 'Are you sure you want to delete this item? This action cannot be undone.',
        
        // Placeholder sections
        'coming_soon' => 'Coming soon',
        'stats_coming' => 'Detailed statistics will be available soon.',
        'logs_coming' => 'Log viewing will be available soon.',
        'settings_coming' => 'System settings will be available soon.',
        
        // Settings Tabs
        'tab_main_config' => 'Configuration',
        'tab_appearance' => 'Appearance',
        'tab_web_apis' => 'External APIs',
        'tab_user_limits' => 'User Limits',
        
        // Main Config
        'main_config_title' => 'Main Configuration',
        'main_config_desc' => 'Global settings for the SnowShelf application.',
        'cfg_timezone' => 'Timezone',
        'cfg_timezone_hint' => 'E.g.: Europe/Paris, America/New_York',
        'cfg_ocr_timeout' => 'OCR Timeout (ms)',
        'cfg_ocr_timeout_hint' => 'Wait time for OCR service in milliseconds',
        'cfg_ocr_url' => 'OCR Service URL',
        'cfg_infos_url' => 'Infos Service URL (toys_api)',
        'cfg_encryption_key' => 'API Encryption Key',
        'cfg_encryption_key_hint' => 'AES-256 key to encrypt API keys for toys_api (must match API_ENCRYPTION_KEY of the service)',
        'cfg_trad_url' => 'Translation Service URL',
        'test_url' => 'Test URL',
        'url_testing' => 'Testing...',
        'url_accessible' => 'URL accessible',
        'url_not_accessible' => 'URL not accessible',
        'url_invalid' => 'Invalid URL format',
        'confirm_save_invalid_urls' => 'Some URLs are not accessible. Do you still want to save?',
        
        // Appearance
        'appearance_title' => 'Default Appearance',
        'appearance_desc' => 'Set the default theme, language and background image for new users.',
        'default_theme' => 'Default Theme',
        'default_theme_hint' => 'Theme applied to new users',
        'default_lang' => 'Default Language',
        'default_lang_hint' => 'Language applied to new users',
        'default_background' => 'Default Background Image',
        'default_background_hint' => 'Background image displayed (max 5 MB). Users can set their own image.',
        'no_background' => 'No image',
        'select_image' => 'Choose an image',
        'remove_image' => 'Remove',
        
        // Web APIs
        'web_apis_title' => 'External APIs',
        'add_api' => 'Add API',
        'edit_api' => 'Edit API',
        'api_name' => 'Name',
        'api_type' => 'Type',
        'api_limits' => 'Limits',
        'api_features' => 'Features',
        'api_status' => 'Status',
        'api_name_field' => 'Technical identifier',
        'api_name_hint' => 'Unique name without spaces (e.g.: google_books)',
        'api_name_uf' => 'Display name',
        'api_alias' => 'Alias (sub-providers)',
        'api_alias_hint' => 'Comma-separated list of sub-providers (e.g.: deezer,discogs,spotify for music)',
        'api_type_field' => 'Content Type',
        'select_type' => 'Select a type',
        'api_client_id' => 'Client ID',
        'api_key_field' => 'API Key',
        'api_max_premium' => 'Max results (Premium)',
        'api_max_free' => 'Max results (Free)',
        'api_notes' => 'Notes',
        'api_notes_placeholder' => 'Additional information about this API...',
        'api_default_active' => 'Active by default',
        'api_user_api' => 'User API',
        'api_read_code' => 'Barcode Reading',
        'api_has_details' => 'Details Available',
        'api_client_id_on' => 'Requires Client ID',
        'api_premium_only' => 'Premium Only',
        
        // User Limits
        'user_limits_title' => 'User Limits',
        'user_limits_desc' => 'Define feature limits for free and premium users.',
        'add_limit' => 'Add limit',
        'edit_limit' => 'Edit limit',
        'limit_free' => 'Free Limit',
        'limit_premium' => 'Premium Limit',
        'limit_free_hint' => 'Maximum number for free users',
        'limit_premium_hint' => 'Leave empty for unlimited',
        
        // Default Grades
        'tab_grades' => 'Grades',
        'grades_title' => 'Default Grades',
        'grades_desc' => 'Manage default grades (physical conditions) available to all users. Premium users can create their own custom grades.',
        'add_grade' => 'Add grade',
        'edit_grade' => 'Edit grade',
        'grade_name' => 'Name',
        'grade_description' => 'Description',
        'grade_usage' => 'Usage',
        'grade_name_field' => 'Grade name',
        'grade_name_hint' => 'E.g.: Mint, Very Good, Good...',
        'grade_description_field' => 'Description',
        'grade_description_hint' => 'Short description of this grade (optional)',
        'grade_created' => 'Grade created successfully',
        'grade_updated' => 'Grade updated successfully',
        'grade_deleted' => 'Grade deleted successfully',
        'grade_delete_confirm' => 'Delete this grade?',
        'grade_delete_warning' => 'This grade will be removed from all items using it.',
        'grade_in_use' => 'Warning: this grade is used on %d item(s).',
        'no_grades' => 'No default grades configured.',
        
        // Default Statuses
        'tab_statuses' => 'Statuses',
        'statuses_title' => 'Default Statuses',
        'statuses_desc' => 'Manage possession statuses (Owned, Wanted, On Order...) available by default for all users. Premium users can create their own custom statuses.',
        'add_status' => 'Add status',
        'edit_status' => 'Edit status',
        'status_name' => 'Name',
        'status_description' => 'Description',
        'status_color' => 'Color',
        'status_icon' => 'Icon',
        'status_usage' => 'Usage',
        'status_name_field' => 'Status name',
        'status_name_hint' => 'E.g.: Owned, Wanted, On Order...',
        'status_description_field' => 'Description',
        'status_description_hint' => 'Short description of this status (optional)',
        'status_color_field' => 'Color',
        'status_color_hint' => 'Display color for the status (hexadecimal format)',
        'status_icon_field' => 'Icon',
        'status_icon_hint' => 'Feather icon name (e.g.: check-circle, heart, shopping-cart)',
        'status_ordre' => 'Order',
        'status_ordre_hint' => 'Position in the list (smaller = higher)',
        'status_created' => 'Status created successfully',
        'status_updated' => 'Status updated successfully',
        'status_deleted' => 'Status deleted successfully',
        'status_delete_confirm' => 'Delete this status?',
        'status_delete_warning' => 'This status will be removed from all items using it.',
        'status_in_use' => 'Warning: this status is used on %d item(s).',
        'no_statuses' => 'No default statuses configured.',
        
        // Upload Configuration
        'tab_upload_config' => 'Uploads',
        'upload_config_title' => 'Upload Configuration',
        'upload_config_desc' => 'Manage allowed file types, maximum sizes and upload categories. These settings are used by SecureUpload to validate uploaded files.',
        'add_upload_config' => 'Add category',
        'edit_upload_config' => 'Edit configuration',
        'upload_category' => 'Category',
        'upload_category_hint' => 'Unique identifier in lowercase (e.g.: avatar, images, videos)',
        'upload_category_pattern' => 'Only lowercase letters and underscores',
        'upload_extensions' => 'Allowed extensions',
        'upload_extensions_hint' => 'Comma-separated (e.g.: jpg, png, gif, webp)',
        'upload_max_size' => 'Max size',
        'upload_max_size_hint' => 'Maximum allowed size in megabytes (1-2048 MB)',
        'upload_description' => 'Description',
        'upload_description_placeholder' => 'Short description of this category...',
        'upload_is_active' => 'Active',
        'upload_is_active_hint' => 'Disabled = uploads of this type will be rejected',
        'upload_status' => 'Status',
        'upload_status_active' => 'Active',
        'upload_status_inactive' => 'Inactive',
        'upload_config_created' => 'Upload category created successfully',
        'upload_config_updated' => 'Configuration updated successfully',
        'upload_config_deleted' => 'Upload category deleted',
        'upload_config_delete_confirm' => 'Delete this upload category?',
        'upload_config_delete_warning' => 'Warning: uploads of this type will no longer be accepted.',
        'upload_category_exists' => 'This category already exists',
        'no_upload_configs' => 'No upload configuration.',
        
        // Proxy Whitelist
        'tab_proxy_whitelist' => 'Proxy Whitelist',
        'proxy_whitelist_title' => 'Allowed Domains (Proxy)',
        'proxy_whitelist_desc' => 'Manage allowed domains for image and file download via the proxy. One domain per line.',
        'proxy_category_images' => 'Images',
        'proxy_category_audio' => 'Audio',
        'proxy_category_documents' => 'Documents',
        'proxy_category_general' => 'General',
        'proxy_domains_count' => '%d domain(s)',
        'proxy_domains_placeholder' => 'One domain per line...\nExample:\nexample.com\ncdn.example.com\napi.example.org',
        'proxy_whitelist_saved' => 'Whitelist updated successfully',
        'proxy_whitelist_error' => 'Error updating whitelist',
        'proxy_add_domain' => 'Add a domain',
        'proxy_domain_field' => 'Domain',
        'proxy_domain_hint' => 'e.g. api.example.com or example.com',
        'proxy_category_field' => 'Category',
        'proxy_description_field' => 'Description',
        'proxy_description_hint' => 'Optional domain description',
        'proxy_domain_added' => 'Domain added successfully',
        'proxy_domain_updated' => 'Domain updated',
        'proxy_domain_deleted' => 'Domain deleted',
        'proxy_domain_exists' => 'This domain already exists in this category',
        
        // Types primaires et fournisseurs
        'tab_primary_types' => 'Types & Providers',
        'primary_types_title' => 'Primary Types and Default Providers',
        'primary_types_desc' => 'Associate each primary type with a web API type and select the default providers for web search.',
        'primary_type_webapi_type' => 'Associated API type',
        'primary_type_webapi_type_none' => '-- None --',
        'primary_type_default_providers' => 'Default providers',
        'primary_type_no_providers' => 'No provider available for this type',
        'primary_type_saved' => 'Type configuration saved',
        'primary_type_error' => 'Error while saving',
        
        // Databases Section
        'databases' => 'Databases',
        'databases_subtitle' => 'Manage SnowShelf internal databases.',
        
        // VG_DB Platforms
        'db_vg_platforms' => 'VG_DB Platforms',
        'db_total_platforms' => 'Total platforms',
        'db_with_local_images' => 'With local images',
        'db_with_external_images' => 'With external images',
        'db_with_images' => 'With images',
        'db_without_images' => 'Without images',
        'db_without_images_filter' => 'Without images',
        'db_search_platforms' => 'Search platform...',
        'db_all_manufacturers' => 'All manufacturers',
        'db_all_images' => 'All images',
        'db_local_images' => 'Local images',
        'db_external_images' => 'External images',
        'db_add_platform' => 'Add platform',
        'db_fetch_images' => 'Fetch images',
        'db_fetch_all_images_title' => 'Automatically fetch missing images',
        'db_fetching_images' => 'Fetching images...',
        'db_col_image' => 'Image',
        'db_col_name' => 'Name',
        'db_col_manufacturer' => 'Manufacturer',
        'db_col_release_date' => 'Release date',
        'db_col_images_count' => 'Images',
        
        // Platform modal
        'db_edit_platform' => 'Edit platform',
        'db_create_platform' => 'New platform',
        'db_platform_name' => 'Name',
        'db_platform_slug' => 'Slug',
        'db_platform_manufacturer' => 'Manufacturer',
        'db_platform_release_date' => 'Release date',
        'db_platform_generation' => 'Generation',
        'db_platform_local_images' => 'Local images',
        'db_platform_remote_image' => 'Remote image (URL)',
        'db_platform_upload_hint' => 'Drag and drop images or click to select',
        'db_platform_no_local_images' => 'No local images',
        'db_platform_saved' => 'Platform saved',
        'db_platform_created' => 'Platform created',
        'db_platform_deleted' => 'Platform deleted',
        'db_platform_image_uploaded' => 'Image uploaded',
        'db_platform_image_deleted' => 'Image deleted',
        'db_delete_platform_confirm' => 'Delete this platform?',
        'db_delete_image_confirm' => 'Delete this image?',
        'db_no_platforms' => 'No platforms found.',
        
        // Type Fields (Metadata fields)
        'tab_type_fields' => 'Detail Fields',
        'type_fields_title' => 'Metadata Fields',
        'type_fields_desc' => 'Manage metadata fields displayed in the "Details" tab of the item modal, for each primary type.',
        'filter_by_type' => 'Filter by type',
        'order' => '#',
        'field_key' => 'Key',
        'field_name' => 'Name (FR)',
        'field_type' => 'Type',
        'mappings' => 'Mappings',
        'add_type_field' => 'Add field',
        'edit_type_field' => 'Edit field',
        'primary_type' => 'Primary type',
        'display_order' => 'Display order',
        'translations_json' => 'Translations (JSON)',
        'field_options_json' => 'Options (JSON)',
        'required' => 'Required field',
        
        // Field Mappings (API Mappings)
        'tab_field_mappings' => 'API Mappings',
        'target_field' => 'Target field',
        'add_field_mapping' => 'Add mapping',
        'edit_field_mapping' => 'Edit mapping',
        'field_mappings_title' => 'API → Field Mappings',
        'field_mappings_desc' => 'Configure the mapping between keys returned by web search APIs and metadata fields. Allows automatic transformation of values during import.',
        'item_field_mappings' => 'Fixed fields',
        'item_field_mappings_tooltip' => 'Configure mappings for fixed fields (name, description, value, media)',
        'filter_by_field' => 'Field',
        'api_keys' => 'API Keys',
        'transform' => 'Transform',
        'transform_config' => 'Transform Configuration',
        'priority' => 'Priority',
        'active' => 'Active',
        'field' => 'Field',
        'type' => 'Type',
    ],

    // ============================================
    // USER ACCOUNT MANAGEMENT
    // ============================================
    'account' => [
        'title' => 'My Account',
        
        // Tabs
        'tab_profile' => 'Profile',
        'tab_security' => 'Security',
        'tab_appearance' => 'Appearance',
        'tab_privacy' => 'Privacy',
        
        // Profile Section
        'profile_title' => 'Profile Information',
        'profile_subtitle' => 'Manage your personal information and avatar.',
        'change_avatar' => 'Change avatar',
        'avatar_hint' => 'JPG, PNG or GIF. Maximum 2 MB.',
        'username_hint' => '3 to 50 characters. Letters, numbers and underscores only.',
        'email_hint' => 'Your login email address.',
        'bio' => 'Biography',
        'bio_placeholder' => 'Tell us about yourself and your collections...',
        'bio_hint' => 'Visible on your public profile. Maximum 500 characters.',
        'newsletter' => 'Subscribe to newsletter',
        'newsletter_hint' => 'News, new features and collection tips.',
        'account_info' => 'Account Information',
        'member_since' => 'Member since',
        'account_type' => 'Account type',
        'premium_until' => 'Premium until',
        
        // Security Section
        'security_title' => 'Account Security',
        'security_subtitle' => 'Manage your password and security options.',
        'change_password' => 'Change password',
        'current_password' => 'Current password',
        'new_password' => 'New password',
        'confirm_password' => 'Confirm new password',
        'password_requirements' => 'Minimum 8 characters, at least 1 number and 1 special character.',
        'update_password' => 'Update password',
        'danger_zone' => 'Danger Zone',
        'danger_warning' => 'The actions below are irreversible. Proceed with caution.',
        'delete_account' => 'Delete my account',
        'delete_account_title' => 'Delete your account',
        'delete_account_warning' => 'This action is permanent and irreversible. All your collections, items and data will be permanently deleted.',
        'enter_password_confirm' => 'Enter your password to confirm',
        'confirm_delete' => 'Delete permanently',
        
        // Appearance Section
        'appearance_title' => 'Appearance',
        'appearance_subtitle' => 'Customize your interface appearance.',
        'theme_hint' => 'Choose a visual theme for the interface.',
        'lang_hint' => 'User interface language.',
        'background' => 'Background image',
        'no_background' => 'No image',
        'select_image' => 'Choose an image',
        'background_hint' => 'Background image displayed. JPG, PNG, GIF or WebP. Maximum 5 MB.',
        
        // Privacy Section
        'privacy_title' => 'Privacy',
        'privacy_subtitle' => 'Control who can see your information and collection.',
        'collection_visibility' => 'Collection visibility',
        'visibility_private' => '🔒 Private - Only me',
        'visibility_friends' => '👥 Friends - My contacts only',
        'visibility_public' => '🌍 Public - Everyone',
        'visibility_hint' => 'Defines who can see your collection and items.',
        'show_email' => 'Show my email on my public profile',
        'show_email_hint' => 'Allows other members to contact you by email.',
        
        // API Keys Section
        'tab_api_keys' => 'API Keys',
        'api_keys_title' => 'Personal API Keys',
        'api_keys_subtitle' => 'Configure your own API keys to access additional search providers.',
        'api_keys_intro' => 'Some search providers require a personal API key. You can get these keys for free on the provider websites.',
        'api_key_placeholder' => 'Enter your API key...',
        'client_id_placeholder' => 'Enter your Client ID...',
        'client_secret_placeholder' => 'Enter your Client Secret...',
        'api_key_label' => 'API Key',
        'client_id_label' => 'Client ID',
        'client_secret_label' => 'Client Secret / Token',
        'no_api_keys_configured' => 'No API keys configured',
        'get_api_key' => 'Get API Key',
        'api_key_saved' => 'API key saved successfully',
        'api_key_deleted' => 'API key deleted',
        'api_key_error' => 'Error saving API key',
        'api_key_test' => 'Test',
        'api_key_testing' => 'Testing...',
        'api_key_valid' => 'API key is valid',
        'api_key_invalid' => 'API key is invalid or expired',
        'api_key_remove' => 'Remove key',
        'api_key_remove_confirm' => 'Do you want to remove this API key?',
        'api_provider_type' => 'Type: %s',
        'api_provider_docs' => 'Documentation',
        'api_key_configured' => 'Configured',
        'api_key_shared_with' => 'This key will also be used by',
    ],

    // ============================================
    // ICON EDITOR
    // ============================================
    'icon_editor' => [
        'title' => 'Icon Editor',
        'rotate_left' => 'Rotate left',
        'rotate_right' => 'Rotate right',
        'flip_horizontal' => 'Flip horizontal',
        'flip_vertical' => 'Flip vertical',
        'zoom_in' => 'Zoom in',
        'zoom_out' => 'Zoom out',
        'reset' => 'Reset',
        'cancel' => 'Cancel',
        'save' => 'Save',
        'preview' => 'Preview',
        'drag_hint' => 'Drag to move',
        'zoom_hint' => 'Scroll or pinch to zoom',
        'loading' => 'Loading...',
        'error_load' => 'Failed to load image',
        'error_save' => 'Failed to save',
    ],

    // ============================================
    // IMAGE EDITOR
    // ============================================
    'image_editor' => [
        'title' => 'Image Editor',
        'rotate_left' => 'Rotate left (90°)',
        'rotate_right' => 'Rotate right (90°)',
        'flip_horizontal' => 'Flip horizontal',
        'flip_vertical' => 'Flip vertical',
        'zoom_in' => 'Zoom in',
        'zoom_out' => 'Zoom out',
        'reset' => 'Reset',
        'crop' => 'Crop',
        'crop_mode' => 'Crop mode',
        'brightness' => 'Brightness',
        'contrast' => 'Contrast',
        'saturation' => 'Saturation',
        'preview' => 'Preview',
        'drag_hint' => 'Drag to move',
        'zoom_hint' => 'Scroll or pinch to zoom',
        'error_load' => 'Failed to load image',
        'error_save' => 'Failed to save',
        'processing' => 'Processing...',
    ],

    // ============================================
    // CAMERA CAPTURE
    // ============================================
    'camera' => [
        'title' => 'Take a photo',
        'initializing' => 'Initializing camera...',
        'error_camera' => 'Unable to access camera',
        'error_permission' => 'Camera access denied. Please allow access in your browser settings.',
        'error_not_supported' => 'Your browser does not support camera access',
        'error_capture' => 'Capture error',
        'retry' => 'Retry',
        'take_photo' => 'Take a photo',
        'switch_camera' => 'Switch camera',
        'flash' => 'Flash',
        'flash_off' => 'Flash off',
        'flash_on' => 'Flash on',
        'flash_auto' => 'Auto flash',
        'zoom_hint' => 'Scroll or pinch to zoom',
        'select_camera' => 'Camera:',
        'camera' => 'Camera',
        'processing' => 'Processing...',
        'front_camera' => 'Front',
        'back_camera' => 'Back',
        'wide_camera' => 'Wide angle',
        'ultra_camera' => 'Ultra wide',
        'tele_camera' => 'Telephoto',
        // Scan mode
        'scan_title' => 'Scanner',
        'scan_capture' => 'Scan',
        'scan_barcode_label' => 'Barcode',
        'scan_document_label' => 'Document',
        'scan_auto_label' => 'Auto',
        'scan_barcode_hint' => 'Place the barcode in the frame',
        'scan_document_hint' => 'Frame the text to recognize',
        'scan_auto_hint' => 'Barcode or text detected automatically',
        'scan_searching' => 'Searching...',
        'scan_detected' => 'Detected!',
    ],
    
    // Media Manager
    'media' => [
        'add_files' => 'Add',
        'drag_drop' => 'Drag & drop or click here',
        'delete_all' => 'Delete all',
        'delete_confirm' => 'Delete this file?',
        'delete_all_confirm' => 'Delete all files in this category?',
        'no_files' => 'No files',
        'uploading' => 'Uploading...',
        'processing' => 'Processing...',
        'error_upload' => 'Upload error',
        'error_type' => 'File type not allowed',
        'error_size' => 'File too large',
        'play' => 'Play',
        'pause' => 'Pause',
        'view' => 'View',
        'download' => 'Download',
        'edit' => 'Edit',
        'images' => 'Images',
        'videos' => 'Videos',
        'audio' => 'Audio',
        'documents' => 'Documents',
        'tab_images' => 'Images',
        'tab_videos' => 'Videos',
        'tab_audio' => 'Audio',
        'tab_documents' => 'Documents',
        'section_title' => 'Media',
        'loading' => 'Loading media...',
        'error_load' => 'Failed to load media',
    ],

    // ============================================
    // DOCUMENT VIEWER
    // ============================================
    'document_viewer' => [
        // Common
        'loading' => 'Loading...',
        'error_load' => 'Unable to load file',
        'error_format' => 'Unsupported format',
        'download' => 'Download',
        'close' => 'Close',
        'fullscreen' => 'Fullscreen',
        'exit_fullscreen' => 'Exit fullscreen',
        
        // Navigation
        'page' => 'Page',
        'of' => 'of',
        'prev_page' => 'Previous page',
        'next_page' => 'Next page',
        'first_page' => 'First page',
        'last_page' => 'Last page',
        
        // Zoom
        'zoom_in' => 'Zoom in',
        'zoom_out' => 'Zoom out',
        'zoom_reset' => 'Reset zoom',
        'fit' => 'Fit to view',
        'fit_width' => 'Fit to width',
        'fit_height' => 'Fit to height',
        
        // Image
        'rotate_left' => 'Rotate left',
        'rotate_right' => 'Rotate right',
        
        // Archive
        'files' => 'files',
        'folders' => 'folders',
        'extract' => 'Extract',
        'extract_all' => 'Extract all',
        'extracting' => 'Extracting...',
        'archive_empty' => 'Empty archive',
        
        // EPUB
        'table_of_contents' => 'Table of contents',
        'show_toc' => 'Show table of contents',
        'hide_toc' => 'Hide table of contents',
        'chapter' => 'Chapter',
        'prev_chapter' => 'Previous chapter',
        'next_chapter' => 'Next chapter',
        
        // Comic / BD
        'single_page' => 'Single page',
        'double_page' => 'Double page',
        'reading_mode' => 'Reading mode',
        
        // Download
        'download_title' => 'Download file',
        'download_desc' => 'This file type cannot be previewed. You can download it to open.',
        'file_type' => 'File type',
    ],

    // ============================================
    // COLLECTION
    // ============================================
    'collection' => [
        // General
        'title' => 'My Collection',
        'items_count' => 'items',
        'item_count' => 'item',
        'add_item' => 'Add item',
        'add_first_item' => 'Add your first item',
        'loading' => 'Loading...',
        'error_loading' => 'Error loading collection',
        
        // Search and filters
        'search_placeholder' => 'Search my collection...',
        'filters' => 'Filters',
        'filters_title' => 'Advanced filters',
        'sort' => 'Sort',
        'sort_name_asc' => 'Name (A-Z)',
        'sort_name_desc' => 'Name (Z-A)',
        'sort_recent' => 'Most recent',
        'sort_oldest' => 'Oldest',
        'sort_rating' => 'Highest rating',
        'sort_value' => 'Highest value',
        
        // Filters
        'filter_categories' => 'Categories',
        'all_categories' => 'All categories',
        'filter_rating' => 'Minimum rating',
        'filter_value' => 'Market value',
        'filter_acquisition' => 'Acquisition date',
        'filter_status' => 'Status',
        'all_statuses' => 'All statuses',
        'reset_filters' => 'Reset',
        'apply_filters' => 'Apply',
        'clear_filters' => 'Clear filters',
        
        // Views
        'view_grid' => 'Grid view',
        'view_list' => 'List view',
        
        // Item
        'no_image' => 'No image',
        'categories' => 'Categories',
        'rating' => 'Rating',
        'value' => 'Value',
        'acquired' => 'Acquired on',
        'edit' => 'Edit',
        'delete' => 'Delete',
        
        // Empty states
        'empty_title' => 'Your collection is empty',
        'empty_message' => 'Start by adding your first item to begin your collection.',
        'no_results_title' => 'No results',
        'no_results_message' => 'No items match your search criteria.',
        
        // Actions
        'confirm_delete' => 'Are you sure you want to delete this item? This action cannot be undone.',
        'deleted' => 'Item successfully deleted',
        'error_delete' => 'Error deleting item',
        'back_to_top' => 'Back to top',
        
        // API
        'item_not_found' => 'Item not found',
        'name_required' => 'Name is required',
        'id_required' => 'ID is required',
        'not_owner' => 'You do not own this item',
        'item_created' => 'Item created successfully',
        'item_updated' => 'Item updated successfully',
        'item_deleted' => 'Item deleted successfully',
        'audio_preview_unavailable' => 'Audio preview unavailable (service protection)',
        
        // Categories
        'personal_categories' => 'My categories',
        'default_categories' => 'Default categories',
        
        // View/Edit modal
        'modal_view_title' => 'Item Details',
        'modal_add_title' => 'New Item',
        'modal_edit_title' => 'Edit Item',
        
        // Form fields
        'field_name' => 'Name',
        'field_name_placeholder' => 'Item name',
        'field_description' => 'Description',
        'field_description_placeholder' => 'Describe this item...',
        'field_notes' => 'Personal notes',
        'field_notes_placeholder' => 'Private notes, visible only to you...',
        'field_barcode' => 'Barcode',
        'field_barcode_placeholder' => 'Item barcode',
        'field_rating' => 'Rating',
        'field_rating_hint' => 'Rate from 0.5 to 5 stars',
        'field_purchase_price' => 'Purchase price',
        'field_market_value' => 'Market value',
        'field_acquisition_date' => 'Acquisition date',
        'field_search_state' => 'Search state',
        'field_categories' => 'Categories',
        'field_categories_placeholder' => 'Select categories...',
        'field_grades' => 'Physical condition',
        'field_grades_placeholder' => 'Select a condition...',
        'field_storage_location' => 'Storage location',
        'field_storage_location_placeholder' => 'Where is this item stored...',
        'no_storage_location' => 'Not defined',
        'add_storage_location' => 'Add a location',
        'storage_location_name_placeholder' => 'E.g.: Living room shelf, Attic box...',
        'storage_location_desc_placeholder' => 'Optional description...',
        'storage_location_created' => 'Location created successfully',
        'grades_section_personal' => 'My grades',
        'grades_section_defaults' => 'Default grades',
        'no_grades_for_categories' => 'Select categories to see available conditions',
        'field_grades_placeholder' => 'Select a condition...',
        
        // Sections
        'section_info' => 'Information',
        'section_values' => 'Values',
        'section_dates' => 'Dates',
        'section_media' => 'Media',
        'section_categories' => 'Categories',
        'section_grades' => 'Physical condition',
        'section_status' => 'Status',
        
        // Search states (legacy)
        'search_state_owned' => 'Owned',
        'search_state_searching' => 'Searching',
        'search_state_found' => 'Found',
        
        // Possession statuses
        'field_status' => 'Status',
        'field_status_placeholder' => 'Select a status...',
        'no_status' => 'No status',
        'all_statuses' => 'All statuses',
        'show_default_statuses' => 'Show default statuses',
        
        // Primary type
        'field_primary_type' => 'Content type',
        'field_primary_type_placeholder' => 'Select a type...',
        'no_primary_type' => 'Not defined',
        'all_primary_types' => 'All types',
        
        // Item form tabs
        'tab_general' => 'General',
        'tab_details' => 'Details',
        'tab_media' => 'Media',
        'details_select_type' => 'Select a content type in the "General" tab to see specific fields.',
        'details_no_fields' => 'No specific fields for this type.',
        'details_error' => 'Error loading fields.',
        'select_option' => 'Choose',
        'multiselect_selected' => '{count} selected',
        
        // Categories - selector
        'show_default_categories' => 'Show default categories',
        'auto_select_parents' => 'Auto-select parent categories',
        'categories_selected' => '{count} category(ies) selected',
        'no_category_selected' => 'No category selected',
        'select_categories' => 'Select categories...',
        'hide_default_statuses' => 'Hide default statuses',
        'manage_my_statuses' => 'Manage my statuses',
        'my_statuses' => 'My statuses',
        'default_statuses' => 'Default statuses',
        
        // User status management modal
        'modal_statuses_title' => 'Manage my statuses',
        'modal_status_add' => 'New status',
        'modal_status_edit' => 'Edit status',
        'status_name' => 'Status name',
        'status_name_placeholder' => 'Ex: To restore, Lent to Paul...',
        'status_description' => 'Description',
        'status_description_placeholder' => 'Short description (optional)',
        'status_color' => 'Color',
        'status_icon' => 'Icon',
        'status_icon_hint' => 'Feather icon name (optional)',
        'status_created' => 'Status created',
        'status_updated' => 'Status updated',
        'status_deleted' => 'Status deleted',
        'status_delete_confirm' => 'Delete this status?',
        'status_delete_warning' => 'This status will be removed from all your items.',
        'no_custom_statuses' => 'You don\'t have any custom statuses yet',
        'create_first_status' => 'Create your first status',
        
        // Values
        'no_value' => 'Not specified',
        'no_description' => 'No description',
        'no_notes' => 'No notes',
        'no_barcode' => 'Not specified',
        'no_date' => 'Not specified',
        'no_categories' => 'No categories',
        'no_grades' => 'Not specified',
        'no_location' => 'Not specified',
        
        // Media counters
        'images_count' => '%d image(s)',
        'videos_count' => '%d video(s)',
        'audios_count' => '%d audio(s)',
        'documents_count' => '%d document(s)',
        'media_coming_soon' => 'Media management coming soon',
        
        // Actions
        'save' => 'Save',
        'cancel' => 'Cancel',
        'close' => 'Close',
        'delete_confirm_title' => 'Delete this item?',
        'delete_confirm_message' => 'This action cannot be undone. The item and all associated media will be permanently deleted.',
        'created_success' => 'Item created successfully',
        'updated_success' => 'Item updated successfully',
        'deleted_success' => 'Item deleted successfully',
        'error_load' => 'Error loading item',
        'error_save' => 'Error saving item',
        'error_delete' => 'Error deleting item',
        
        // Formatted dates
        'created_at' => 'Created on',
        'updated_at' => 'Updated on',
        
        // Import from web search
        'error_import_image' => 'Error importing image',
        'error_import_document' => 'Error importing document',
        'import_image_success' => 'Image imported successfully',
        'import_document_success' => 'Document imported successfully',
        'warning_images_protected' => 'Images not imported (source is protected against downloading)',
    ],

    // ============================================
    // WEB SEARCH
    // ============================================
    'web_search' => [
        // Content types
        'type_all' => 'All types',
        'type_video_games' => 'Video Games',
        'type_books' => 'Books',
        'type_toys' => 'Toys',
        'type_generic' => 'Generic',
        'type_movies' => 'Movies & Series',
        'type_music' => 'Music',

        // Labels
        'title' => 'Web Search',
        'type_label' => 'Content type',
        'providers_label' => 'Providers',
        'text_search_label' => 'Text search',
        'text_search_placeholder' => 'Name, title, description...',
        'image_search_label' => 'Image search',
        'image_drop_hint' => 'Drop an image or click',
        'results_title' => 'Results',

        // Buttons
        'search_btn' => 'Search',
        'stop_btn' => 'Stop',
        'browse_file' => 'Browse',
        'camera_btn' => 'Photo',
        'camera_btn_title' => 'Take a photo for recognition',
        'scan_btn' => 'Scan',
        'scan_btn_title' => 'Scan a barcode',
        'search_image_btn' => 'Search',
        'close' => 'Close',
        'select_result' => 'Select',
        'view_source' => 'View source',

        // Options
        'use_local_db_label' => 'Use SnowShelf database',
        'use_local_db_tooltip' => 'Uses cached data. Disable to force a fresh search from external sources',
        'auto_translate_label' => 'Auto-translate',
        'auto_translate_tooltip' => 'If the response is not available in your language, an automatic translation will be performed',
        'auto_translate_premium_hint' => 'Feature reserved for Premium users',

        // States
        'no_results_yet' => 'Start a search to see results',
        'no_results' => 'No results found',
        'searching' => 'Searching...',
        'results_found' => 'result(s)',
        'search_cancelled' => 'Search cancelled',
        'result_selected' => 'Result selected',
        'image_processed' => 'Image processed',

        // Providers
        'supports_barcode' => 'Supports barcodes',
        'no_providers' => 'No providers available for this type',
        'premium_badge' => 'Premium',
        'premium_only_provider' => 'Reserved for Premium users',

        // Errors
        'error_loading' => 'Error loading providers',
        'error_empty_query' => 'Please enter a search text',
        'error_no_provider' => 'Please select at least one provider',
        'error_no_image' => 'Please select an image',
        'error_invalid_image' => 'Invalid image format',
        'error_search' => 'Search error',
        'error_premium_required' => 'Provider %provider% requires a Premium subscription',
        'error_user_key_required' => 'You must configure your API key for %s in your account settings',
        
        // Coming soon
        'image_search_coming_soon' => 'Image search coming soon',
        'camera_not_available' => 'Camera not available',
        'barcode_not_detected' => 'No barcode detected in the image',

        // Details modal and import
        'detail_title' => 'Result details',
        'detail_import_as' => 'Import as',
        'detail_select_type' => 'Choose type',
        'detail_select_fields' => 'Select fields to import',
        'detail_select_all' => 'All',
        'detail_select_none' => 'None',
        'detail_import_btn' => 'Import selection',
        'detail_cancel_btn' => 'Cancel',
        'detail_view_source' => 'View on website',
        'detail_no_metadata' => 'No metadata available',
        'detail_no_description' => 'No description available',
        'detail_metadata_section' => 'Metadata',
        'detail_import_section' => 'Import options',
        'detail_field_name' => 'Suggested name',
        'detail_field_description' => 'Description',
        'detail_field_image' => 'Image',
        'detail_field_images' => 'Images',
        'detail_field_price' => 'Market value',
        'detail_field_barcode' => 'Barcode',
        'detail_field_videos' => 'Videos',
        'detail_field_audio' => 'Audio',
        'detail_field_documents' => 'Documents / Manuals',
        'detail_general_fields' => 'General information',
        'detail_media_fields' => 'Media',
        'detail_type_fields' => 'Specific details',
        'detail_no_media' => 'No media available',
        'detail_no_type_fields' => 'No specific fields for this type',
        'detail_import_success' => 'Data imported successfully',
        'detail_no_field_selected' => 'Please select at least one field to import',
        'detail_load_more' => 'More details',
        'detail_load_more_title' => 'Load full information from the provider',
        'detail_loading' => 'Loading...',
        'detail_loaded' => 'Details loaded',
        'detail_loaded_success' => 'Details loaded successfully',
        'detail_load_error' => 'Error loading details',
        'detail_refresh' => 'Refresh',
        'detail_refresh_title' => 'Reload details from API',
        'detail_from_cache' => 'Cached data - Click to refresh',
        'detail_retry' => 'Retry',
        'detail_images_hint' => 'Click = view, Double-click = select',
        'detail_images_selected' => 'selected',
        'detail_select_all_images' => 'Select all',
        'detail_deselect_all_images' => 'Deselect all',
        'detail_instructions_section' => 'Instruction manuals',
        'detail_selected' => 'selected',
        'detail_view_pdf' => 'View PDF',
        'detail_deselect_all' => 'Deselect all',

        // Import confirmation
        'import_confirm_title' => 'Confirm replacement',
        'import_confirm_message' => 'The following fields already contain data and will be replaced:',
        'import_confirm_yes' => 'Replace',
        'import_confirm_cancel' => 'Cancel',
        'import_field_name' => 'Suggested name',
        'import_field_description' => 'Description',
        'import_field_price' => 'Market value',
        'import_field_barcode' => 'Barcode',
        'import_cancelled' => 'Import cancelled',
        'warning_docs_failed' => 'Some documents could not be imported (files inaccessible or network error).',
        'warning_docs_partial' => '{imported}/{total} document(s) imported. Some files could not be downloaded.',
    ],
    
    // Metadata labels (for web import)
    'metadata' => [
        // Common
        'year' => 'Year',
        'rating' => 'Rating',
        'price' => 'Price',
        'availability' => 'Availability',
        'reviews_count' => 'Number of reviews',
        
        // Toys / LEGO
        'set_number' => 'Set Number',
        'brand' => 'Brand',
        'pieces' => 'Pieces',
        'unique_parts' => 'Unique Parts',
        'minifigs' => 'Minifigures',
        'minifigs_list' => 'Minifigures List',
        'theme' => 'Theme',
        'theme_id' => 'Theme ID',
        'subtheme' => 'Subtheme',
        'age_range' => 'Age Range',
        'dimensions' => 'Dimensions',
        'weight' => 'Weight',
        'designer' => 'Designer',
        'difficulty' => 'Difficulty',
        'vip_points' => 'VIP Points',
        'instructions_url' => 'Instructions',
        'instructions' => 'Instructions',
        'instructions_count' => 'Instruction Manuals',
        'rebrickable_id' => 'Rebrickable ID',
        'parts_count' => 'Parts Count',
        
        // Books
        'authors' => 'Authors',
        'author' => 'Author',
        'isbn' => 'ISBN',
        'pages' => 'Pages',
        'publisher' => 'Publisher',
        'language' => 'Language',
        
        // Video Games
        'platforms' => 'Platforms',
        'platform' => 'Platform',
        'developer' => 'Developer',
        'developers' => 'Developers',
        'publishers' => 'Publishers',
        'release_date' => 'Release Date',
        'genres' => 'Genres',
        'genre' => 'Genre',
        'metacritic' => 'Metacritic',
        'playtime' => 'Playtime',
        'esrb_rating' => 'ESRB Rating',
        
        // Movies / Series
        'runtime' => 'Runtime',
        'duration' => 'Duration',
        'director' => 'Director',
        'episodes' => 'Episodes',
        'seasons' => 'Seasons',
        'media_type' => 'Media Type',
        'votes' => 'Votes',
        'tagline' => 'Tagline',
        'budget' => 'Budget',
        'revenue' => 'Revenue',
        'status' => 'Status',
        'original_language' => 'Original Language',
        'production_companies' => 'Production Companies',
        'networks' => 'Networks',
        
        // Music
        'artist' => 'Artist',
        'album' => 'Album',
        'track_count' => 'Track Count',
        'tracks' => 'Tracks',
        
        // Misc
        'category' => 'Category',
        'collection' => 'Collection',
        'series' => 'Series',
        'condition' => 'Condition',
        'barcode' => 'Barcode',
        'barcode_type' => 'Barcode Type',
        
        // Sticker albums
        'total_stickers' => 'Total stickers',
        'special_stickers' => 'Special stickers',
        'checklist' => 'Checklist',
    ],
];
