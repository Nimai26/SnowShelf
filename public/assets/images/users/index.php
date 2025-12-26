<?php
// Empêcher l'accès direct et le listing du répertoire
http_response_code(403);
exit('Access Denied');
