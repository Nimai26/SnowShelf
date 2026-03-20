# 🔐 SÉCURITÉ & AUTHENTIFICATION - SnowShelf v2

> **Document de référence** - Stratégies de sécurité complètes
> 
> **Date de création** : 20 février 2026
> **Status** : ✅ Spécifications complètes

---

## 🎯 Principes de Sécurité

### Defense in Depth (Défense en profondeur)
✅ Multiples couches de sécurité  
✅ Fail-secure (échec vers état sécurisé)  
✅ Principe du moindre privilège  
✅ Séparation des responsabilités  
✅ Validation côté client ET serveur  

### Compliance
✅ **RGPD** : Protection données personnelles  
✅ **OWASP Top 10** : Protection contre vulnérabilités courantes  
✅ **ISO 27001** : Bonnes pratiques sécurité  

---

## 🔑 Système d'Authentification

### Architecture JWT (Double Token)

```
┌─────────────────────────────────────────────────────────┐
│                    JWT ARCHITECTURE                      │
└─────────────────────────────────────────────────────────┘

┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       │ 1. POST /auth/login
       │    { email, password }
       ▼
┌──────────────┐
│   Backend    │
│              │
│ ┌──────────┐ │
│ │ Validate │ │ - Check email exists
│ │Credentials│ │ - Verify password (bcryptjs)
│ └─────┬────┘ │ - Check email_verified
│       │      │ - Check user is_active
│       ▼      │
│ ┌──────────┐ │
│ │ Generate │ │ - Access Token (15 min)
│ │  Tokens  │ │ - Refresh Token (7 days)
│ └─────┬────┘ │
└───────┼──────┘
        │
        │ 2. Return tokens + user
        ▼
┌──────────────┐
│   Client     │
│              │
│ • Store Access Token in memory (state)
│ • Store Refresh Token in:
│   - httpOnly cookie (web)
│   - SecureStorage (mobile)
└──────┬───────┘
       │
       │ 3. API requests
       │    Header: Authorization: Bearer {accessToken}
       ▼
┌──────────────┐
│   Backend    │
│              │
│ ┌──────────┐ │
│ │  Verify  │ │ - Validate JWT signature
│ │   JWT    │ │ - Check expiration
│ └─────┬────┘ │ - Extract payload (userId, role)
│       │      │ - Authorize resource
│       ▼      │
│  ✅ or ❌   │
└──────────────┘
```

### Tokens JWT

#### Access Token (courte durée)

```typescript
interface AccessTokenPayload {
  sub: number;          // User ID
  email: string;
  role: 'free' | 'premium' | 'admin';
  iat: number;          // Issued at
  exp: number;          // Expires in 15 minutes
}

// Génération
const accessToken = jwt.sign(
  { sub: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);
```

#### Refresh Token (longue durée)

```typescript
interface RefreshTokenPayload {
  sub: number;
  jti: string;          // JWT ID unique
  iat: number;
  exp: number;          // Expires in 7 days
}

// Génération
const refreshToken = jwt.sign(
  { sub: user.id, jti: uuidv4() },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

// Stockage en BDD (pour révocation)
await db.refreshTokens.create({
  userId: user.id,
  token: refreshToken,
  jti: payload.jti,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip
});
```

### Endpoints d'Authentification

#### POST /auth/register

```typescript
// Validation
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Minimum 3 caractères')
    .max(50, 'Maximum 50 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Seulement lettres, chiffres et underscore'),
  
  email: z.string()
    .email('Email invalide')
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[0-9]/, 'Doit contenir au moins 1 chiffre')
    .regex(/[!@#$%^&*]/, 'Doit contenir au moins 1 caractère spécial'),
  
  lang: z.enum(['fr', 'en']).default('fr')
});

// Processus
async function register(dto: RegisterDto) {
  // 1. Valider données
  const validated = registerSchema.parse(dto);
  
  // 2. Vérifier unicité email
  const existingUser = await usersRepo.findByEmail(validated.email);
  if (existingUser) {
    throw new ConflictException('Email déjà utilisé');
  }
  
  // 3. Vérifier unicité username
  const existingUsername = await usersRepo.findByUsername(validated.username);
  if (existingUsername) {
    throw new ConflictException('Nom d\'utilisateur déjà pris');
  }
  
  // 4. Hasher le mot de passe (bcryptjs, cost 12)
  const passwordHash = await bcrypt.hash(validated.password, 12);
  
  // 5. Générer token de vérification email
  const emailToken = randomBytes(32).toString('hex');
  const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  
  // 6. Créer utilisateur
  const user = await usersRepo.create({
    username: validated.username,
    email: validated.email,
    passwordHash,
    emailToken,
    emailTokenExpires,
    lang: validated.lang,
    role: 'free',
    emailVerified: false
  });
  
  // 7. Envoyer email de vérification
  await emailService.sendVerificationEmail(user.email, emailToken, validated.lang);
  
  return { userId: user.id, email: user.email };
}
```

#### POST /auth/login

```typescript
async function login(email: string, password: string) {
  // 1. Trouver utilisateur par email
  const user = await usersRepo.findByEmail(email);
  if (!user) {
    throw new UnauthorizedException('Identifiants invalides');
  }
  
  // 2. Vérifier email vérifié
  if (!user.emailVerified) {
    throw new UnauthorizedException('Veuillez vérifier votre email');
  }
  
  // 3. Vérifier compte actif
  if (!user.isActive) {
    throw new UnauthorizedException('Compte désactivé');
  }
  
  // 4. Vérifier mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    // Log tentative échouée
    await securityLog.logFailedLogin(user.id, req.ip);
    throw new UnauthorizedException('Identifiants invalides');
  }
  
  // 5. Vérifier rate limiting (max 5 tentatives/5min)
  await rateLimit.checkLoginAttempts(user.id, req.ip);
  
  // 6. Générer tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateAndStoreRefreshToken(user, req);
  
  // 7. Mettre à jour last_login
  await usersRepo.updateLastLogin(user.id);
  
  // 8. Log connexion réussie
  await securityLog.logSuccessfulLogin(user.id, req.ip);
  
  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}
```

#### POST /auth/refresh

```typescript
async function refreshAccessToken(refreshToken: string) {
  // 1. Vérifier JWT refresh token
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new UnauthorizedException('Token invalide ou expiré');
  }
  
  // 2. Vérifier token en BDD (pas révoqué)
  const storedToken = await db.refreshTokens.findOne({
    where: { jti: payload.jti, userId: payload.sub }
  });
  
  if (!storedToken || storedToken.revoked) {
    throw new UnauthorizedException('Token révoqué');
  }
  
  // 3. Vérifier expiration en BDD (sécurité supplémentaire)
  if (storedToken.expiresAt < new Date()) {
    throw new UnauthorizedException('Token expiré');
  }
  
  // 4. Récupérer utilisateur
  const user = await usersRepo.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Utilisateur introuvable ou inactif');
  }
  
  // 5. Générer nouveau access token
  const newAccessToken = generateAccessToken(user);
  
  // 6. (Optionnel) Rotation du refresh token
  if (ROTATE_REFRESH_TOKENS) {
    await db.refreshTokens.update(
      { jti: payload.jti },
      { revoked: true, revokedAt: new Date() }
    );
    
    const newRefreshToken = await generateAndStoreRefreshToken(user, req);
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  
  return { accessToken: newAccessToken };
}
```

#### POST /auth/logout

```typescript
async function logout(refreshToken: string) {
  // Révoquer le refresh token
  const payload = jwt.decode(refreshToken) as RefreshTokenPayload;
  
  await db.refreshTokens.update(
    { jti: payload.jti },
    { revoked: true, revokedAt: new Date() }
  );
  
  return { message: 'Déconnexion réussie' };
}
```

#### GET /auth/verify-email?token={token}

```typescript
async function verifyEmail(token: string) {
  // 1. Trouver utilisateur avec ce token
  const user = await usersRepo.findOne({
    where: { emailToken: token }
  });
  
  if (!user) {
    throw new NotFoundException('Token invalide');
  }
  
  // 2. Vérifier expiration
  if (user.emailTokenExpires < new Date()) {
    throw new BadRequestException('Token expiré');
  }
  
  // 3. Marquer email comme vérifié
  await usersRepo.update(user.id, {
    emailVerified: true,
    emailToken: null,
    emailTokenExpires: null
  });
  
  return { message: 'Email vérifié avec succès' };
}
```

---

## 🛡️ Protection des Mots de Passe

### Hachage avec bcryptjs

```typescript
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Cost factor

// Hachage
async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Vérification
async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}
```

**Pourquoi bcryptjs ?**
- ✅ Implémentation JavaScript pure (pas de dépendances natives/node-gyp)
- ✅ Résistant aux attaques par force brute (slow by design)
- ✅ Salt automatique (unique par mot de passe)
- ✅ Cost factor ajustable (12 = ~250ms sur machine moderne)

### Politique des Mots de Passe

```typescript
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireDigit: true,
  requireSpecialChar: true,
  requireUppercase: true,
  requireLowercase: true,
  preventCommon: true, // Check contre liste 10k mots de passe courants
  preventUserInfo: true, // Ne doit pas contenir username/email
  historyCount: 5 // Ne peut pas réutiliser les 5 derniers mots de passe
};

function validatePassword(password: string, user: User): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Minimum ${passwordPolicy.minLength} caractères`);
  }
  
  if (passwordPolicy.requireDigit && !/\d/.test(password)) {
    errors.push('Doit contenir au moins 1 chiffre');
  }
  
  if (passwordPolicy.requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Doit contenir au moins 1 caractère spécial');
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Doit contenir au moins 1 majuscule');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Doit contenir au moins 1 minuscule');
  }
  
  if (passwordPolicy.preventCommon && commonPasswords.includes(password.toLowerCase())) {
    errors.push('Mot de passe trop courant');
  }
  
  if (passwordPolicy.preventUserInfo) {
    const lowerPass = password.toLowerCase();
    if (lowerPass.includes(user.username.toLowerCase()) || 
        lowerPass.includes(user.email.split('@')[0].toLowerCase())) {
      errors.push('Ne doit pas contenir votre nom d\'utilisateur ou email');
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Réinitialisation de Mot de Passe

```typescript
// POST /auth/forgot-password
async function requestPasswordReset(email: string) {
  const user = await usersRepo.findByEmail(email);
  
  // Ne pas révéler si l'email existe (sécurité)
  if (!user) {
    return { message: 'Si l\'email existe, un lien de réinitialisation a été envoyé' };
  }
  
  // Générer token sécurisé
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1h
  
  // Hasher le token avant stockage (double sécurité)
  const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
  
  await usersRepo.update(user.id, {
    resetToken: resetTokenHash,
    resetTokenExpires
  });
  
  // Envoyer email avec lien
  await emailService.sendPasswordResetEmail(user.email, resetToken, user.lang);
  
  return { message: 'Si l\'email existe, un lien de réinitialisation a été envoyé' };
}

// POST /auth/reset-password
async function resetPassword(token: string, newPassword: string) {
  // Hasher le token reçu
  const tokenHash = createHash('sha256').update(token).digest('hex');
  
  // Trouver utilisateur
  const user = await usersRepo.findOne({
    where: { resetToken: tokenHash }
  });
  
  if (!user) {
    throw new BadRequestException('Token invalide');
  }
  
  // Vérifier expiration
  if (user.resetTokenExpires < new Date()) {
    throw new BadRequestException('Token expiré');
  }
  
  // Valider nouveau mot de passe
  const validation = validatePassword(newPassword, user);
  if (!validation.valid) {
    throw new BadRequestException(validation.errors);
  }
  
  // Vérifier historique (pas un ancien mot de passe)
  // ⚠️ NON IMPLÉMENTÉ : la table password_history n'existe pas encore
  // Prévu pour une version future
  /*
  const passwordHistory = await db.passwordHistory.findAll({
    where: { userId: user.id },
    order: [['createdAt', 'DESC']],
    limit: 5
  });
  
  for (const oldHash of passwordHistory) {
    if (await bcrypt.compare(newPassword, oldHash.passwordHash)) {
      throw new BadRequestException('Vous ne pouvez pas réutiliser un ancien mot de passe');
    }
  }
  */
  
  // Hasher nouveau mot de passe
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  
  // Mettre à jour
  await usersRepo.update(user.id, {
    passwordHash: newPasswordHash,
    resetToken: null,
    resetTokenExpires: null
  });
  
  // Stocker dans historique
  await db.passwordHistory.create({
    userId: user.id,
    passwordHash: newPasswordHash
  });
  
  // Révoquer tous les refresh tokens (force logout)
  await db.refreshTokens.update(
    { userId: user.id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
  
  // Envoyer email de confirmation
  await emailService.sendPasswordChangedEmail(user.email, user.lang);
  
  return { message: 'Mot de passe réinitialisé avec succès' };
}
```

---

## 🚪 Autorisation & Permissions

### Guards (NestJS)

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Pas de rôle requis
    }

    const { user } = context.switchToHttp().getRequest();
    
    return requiredRoles.some((role) => user.role === role);
  }
}

// guards/resource-owner.guard.ts
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = +request.params.id;
    
    // Admin peut tout faire
    if (user.role === 'admin') {
      return true;
    }
    
    // Vérifier ownership
    const resource = await this.getResource(resourceId);
    return resource.userId === user.id;
  }
}
```

### Décorateurs

```typescript
// decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// decorators/public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);
```

### Usage dans les Controllers

```typescript
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  
  // Public (pas d'auth requise)
  @Public()
  @Get('public')
  findPublicItems() {
    return this.itemsService.findPublic();
  }
  
  // Authentifié (tous roles)
  @Get()
  findMyItems(@CurrentUser() user: User) {
    return this.itemsService.findByUser(user.id);
  }
  
  // Premium ou Admin uniquement
  @Post()
  @Roles('premium', 'admin')
  createItem(@CurrentUser() user: User, @Body() dto: CreateItemDto) {
    return this.itemsService.create(user.id, dto);
  }
  
  // Admin uniquement
  @Delete(':id')
  @Roles('admin')
  deleteAnyItem(@Param('id') id: number) {
    return this.itemsService.delete(id);
  }
  
  // Proprio ou Admin (custom guard)
  @Put(':id')
  @UseGuards(ResourceOwnerGuard)
  updateItem(@Param('id') id: number, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }
}
```

---

## 🔒 Protection contre les Attaques

### CSRF (Cross-Site Request Forgery)

```typescript
// Pour API REST avec JWT en header Authorization :
// Pas de protection CSRF nécessaire car les JWT ne sont pas envoyés
// automatiquement par le navigateur (contrairement aux cookies).
//
// ⚠️ csurf est déprécié et NON utilisé dans le projet.
```

### XSS (Cross-Site Scripting)

```typescript
// 1. Validation des inputs via class-validator (pas de class-sanitizer)
//    class-sanitizer est déprécié et NON installé.
//    La validation se fait via @IsString(), @MaxLength(), etc.

// 2. Content Security Policy (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://cdn.snowshelf.fr", "data:"],
      connectSrc: ["'self'", "https://api.snowshelf.fr"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://cdn.snowshelf.fr"],
      frameSrc: ["'none'"],
    },
  },
}));

// 3. Escape output côté frontend (React le fait automatiquement)
```

### SQL Injection

```typescript
// TypeORM protège automatiquement avec les paramètres bindés
// ✅ SAFE
const items = await itemsRepo.find({
  where: { name: Like(`%${search}%`) }
});

// ✅ SAFE
const items = await itemsRepo
  .createQueryBuilder('item')
  .where('item.name LIKE :search', { search: `%${search}%` })
  .getMany();

// ❌ UNSAFE (ne jamais faire)
const items = await itemsRepo.query(
  `SELECT * FROM items WHERE name LIKE '%${search}%'`
);
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

// Global rate limiting
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // 60 secondes
      limit: 100, // 100 requêtes max
    }),
  ],
})
export class AppModule {}

// Rate limiting spécifique par endpoint
@Controller('auth')
export class AuthController {
  
  @Post('login')
  @Throttle(5, 60) // 5 tentatives par minute
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
  
  @Post('register')
  @Throttle(3, 3600) // 3 inscriptions par heure (même IP)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}

// Rate limiting avec Redis (production)
@Module({
  imports: [
    ThrottlerModule.forRoot({
      storage: new ThrottlerStorageRedisService(redisClient),
    }),
  ],
})
```

### Brute Force Protection

```typescript
// Guard personnalisé pour bloquer après N échecs
@Injectable()
export class BruteForceGuard implements CanActivate {
  constructor(
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const email = request.body.email;
    
    const keyIP = `login:attempts:ip:${ip}`;
    const keyEmail = `login:attempts:email:${email}`;
    
    // Vérifier tentatives par IP
    const attemptsIP = await this.redis.get(keyIP);
    if (attemptsIP && parseInt(attemptsIP) >= 10) {
      throw new TooManyRequestsException('Trop de tentatives. Réessayez dans 15 minutes.');
    }
    
    // Vérifier tentatives par email
    const attemptsEmail = await this.redis.get(keyEmail);
    if (attemptsEmail && parseInt(attemptsEmail) >= 5) {
      throw new TooManyRequestsException('Trop de tentatives pour ce compte.');
    }
    
    return true;
  }
}

// Incrémenter en cas d'échec de login
async function incrementFailedAttempts(ip: string, email: string) {
  const keyIP = `login:attempts:ip:${ip}`;
  const keyEmail = `login:attempts:email:${email}`;
  
  await redis.incr(keyIP);
  await redis.expire(keyIP, 15 * 60); // 15 minutes
  
  await redis.incr(keyEmail);
  await redis.expire(keyEmail, 60 * 60); // 1 heure
}

// Réinitialiser en cas de succès
async function resetFailure(ip: string, email: string) {
  await redis.del(`login:attempts:ip:${ip}`);
  await redis.del(`login:attempts:email:${email}`);
}
```

---

## 🔐 Sécurité des Uploads

### Validation Stricte

```typescript
import * as fileType from 'file-type';
import * as sharp from 'sharp';

async function validateUpload(file: Express.Multer.File, category: string) {
  const config = await uploadConfigService.getConfig(category);
  
  // 1. Vérifier taille
  if (file.size > config.maxSizeBytes) {
    throw new BadRequestException(`Fichier trop volumineux (max ${config.maxSizeMB}MB)`);
  }
  
  // 2. Vérifier MIME type réel (pas celui envoyé par le client)
  const buffer = await fs.readFile(file.path);
  const detectedType = await fileType.fromBuffer(buffer);
  
  if (!detectedType) {
    throw new BadRequestException('Type de fichier non reconnu');
  }
  
  // 3. Vérifier extension autorisée
  if (!config.allowedMimeTypes.includes(detectedType.mime)) {
    throw new BadRequestException(`Type ${detectedType.mime} non autorisé`);
  }
  
  // 4. Validation spécifique pour images
  if (detectedType.mime.startsWith('image/')) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      // Vérifier dimensions raisonnables
      if (metadata.width! > 10000 || metadata.height! > 10000) {
        throw new BadRequestException('Dimensions d\'image trop grandes');
      }
      
      // Scanner les SVG pour JavaScript malveillant
      if (detectedType.mime === 'image/svg+xml') {
        const svgContent = buffer.toString('utf8');
        if (/<script/i.test(svgContent) || /javascript:/i.test(svgContent)) {
          throw new BadRequestException('SVG contient du code malveillant');
        }
      }
    } catch (error) {
      throw new BadRequestException('Image corrompue ou invalide');
    }
  }
  
  return detectedType;
}
```

### Stockage Sécurisé

```typescript
// 1. Générer nom de fichier sécurisé
function generateSecureFilename(originalName: string, userId: number): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = randomBytes(16).toString('hex');
  return `${userId}_${timestamp}_${random}${ext}`;
}

// 2. Organiser par utilisateur
function getStoragePath(userId: number, category: string, filename: string): string {
  return `storage/users/${userId}/${category}/${filename}`;
}

// 3. Servir avec vérification de permissions
@Controller('media')
export class MediaController {
  @Get(':userId/:category/:filename')
  @UseGuards(JwtAuthGuard)
  async serveFile(
    @Param('userId') userId: number,
    @Param('category') category: string,
    @Param('filename') filename: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    // Vérifier permissions (propriétaire ou admin)
    if (user.id !== userId && user.role !== 'admin') {
      throw new ForbiddenException();
    }
    
    const filePath = getStoragePath(userId, category, filename);
    
    // Vérifier que le fichier existe et est dans le bon dossier (path traversal)
    const realPath = await fs.realpath(filePath);
    const basePath = await fs.realpath(`storage/users/${userId}`);
    
    if (!realPath.startsWith(basePath)) {
      throw new ForbiddenException('Path traversal detected');
    }
    
    return res.sendFile(realPath);
  }
}
```

---

## 🌐 CORS Configuration

```typescript
app.enableCors({
  origin: [
    'https://snowshelf.fr',
    'https://www.snowshelf.fr',
    process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : '',
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 heures
});
```

---

## 📊 Logs de Sécurité

```typescript
interface SecurityEvent {
  type: 'login_success' | 'login_failed' | 'logout' | 'token_refresh' | 'password_reset' | 'permission_denied';
  userId?: number;
  ip: string;
  userAgent: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class SecurityLogger {
  async logEvent(event: SecurityEvent) {
    await db.securityLogs.create(event);
    
    // Alertes pour événements critiques
    if (event.type === 'permission_denied') {
      await this.sendAlert('Tentative d\'accès non autorisé', event);
    }
    
    // Monitoring
    metrics.increment(`security.${event.type}`);
  }
  
  async logFailedLogin(userId: number, ip: string) {
    await this.logEvent({
      type: 'login_failed',
      userId,
      ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });
    
    // Détecter attaques
    const recentFailures = await db.securityLogs.count({
      where: {
        type: 'login_failed',
        userId,
        timestamp: { $gt: new Date(Date.now() - 10 * 60 * 1000) }
      }
    });
    
    if (recentFailures >= 5) {
      await this.sendAlert('Possible attaque brute force', { userId, ip, failures: recentFailures });
    }
  }
}
```

---

## ✅ Checklist Sécurité

### Authentication & Authorization
- [ ] JWT avec expiration courte (15min)
- [ ] Refresh tokens avec rotation
- [ ] Révocation de tokens (stockage en BDD)
- [ ] Vérification email obligatoire
- [ ] Politique robuste de mots de passe
- [ ] Protection brute force (rate limiting)
- [ ] 2FA/MFA (à implémenter)

### API Security
- [ ] HTTPS obligatoire (redirect HTTP→HTTPS)
- [ ] CORS configuré strictement
- [ ] Rate limiting global et par endpoint
- [ ] Validation stricte des inputs (class-validator)
- [ ] Sanitization des données
- [ ] Protection CSRF (si cookies)
- [ ] Headers de sécurité (Helmet.js)

### Data Security
- [ ] Hachage bcryptjs (cost 12)
- [ ] Pas de données sensibles en logs
- [ ] Encryption des données sensibles au repos
- [ ] Backup chiffré
- [ ] Soft delete (pas de suppression définitive)

### Upload Security
- [ ] Validation MIME type réelle
- [ ] Scan antivirus (ClamAV)
- [ ] Limite de taille
- [ ] Noms de fichiers aléatoires
- [ ] Stockage hors webroot
- [ ] .htaccess bloquant exécution PHP

### Monitoring
- [ ] Logs de sécurité
- [ ] Alertes sur événements critiques
- [ ] Audit trail complet
- [ ] Monitoring des métriques
- [ ] Scan de vulnérabilités régulier

---

**Cette documentation définit une posture de sécurité robuste respectant les standards industriels.**
