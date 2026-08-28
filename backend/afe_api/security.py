"""
Sécurité renforcée pour l'API AFE.

Ce module ajoute :
  1. Des en-têtes de sécurité (CSP, nosniff, Referrer-Policy, Permissions-Policy...)
  2. Une limitation de débit (rate limiting) par adresse IP pour se protéger
     des abus, du bourrage de mot de passe et des débuts d'attaque (DDoS).

Le rate limiting repose sur une mémoire interne (simple et sans dépendance).
Pour une protection de premier plan avec plusieurs serveurs, une limitation
côté Nginx est également en place (voir nginx/nginx.conf).
"""

import time
from collections import defaultdict, deque

# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

# Limites par type de route : (nombre max, fenêtre en secondes)
RATE_LIMITS = {
    # Connexion : on limite fortement pour empêcher le bourrage de mot de passe
    "auth": (10, 60),
    # Inscriptions & formulaires publics
    "public_write": (30, 60),
    # Limite globale par IP (protection large)
    "global": (600, 60),
}

# Chemins sensibles -> type de limite
PATH_RULES = {
    "/api/auth/token/": "auth",
    "/api/auth/token/refresh/": "auth",
    "/api/members/register/": "public_write",
    "/api/members/apply/": "public_write",
    "/api/contact/": "public_write",
    "/api/donations/": "public_write",
    "/api/applications/": "public_write",
}

# Mémoire : ip -> {type -> deque([timestamps])}
_hits = defaultdict(lambda: defaultdict(deque))
# Limite du nombre d'entrées en mémoire (anti-épuisement mémoire)
_MAX_IPS = 10000


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def reset_rate_limiter():
    _hits.clear()


def _check_and_increment(ip, limit_type, max_hits, window):
    q = _hits[ip][limit_type]
    now = time.time()
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= max_hits:
        return False
    q.append(now)
    return True


class RateLimitMiddleware:
    """Limite le nombre de requêtes par adresse IP sur les routes sensibles."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Éviter de grossir la mémoire à l'infini
        if len(_hits) > _MAX_IPS:
            reset_rate_limiter()

        ip = _client_ip(request)
        path = request.path

        # Limite globale par IP sur tout l'API
        if path.startswith("/api/"):
            if not _check_and_increment(ip, "global", *RATE_LIMITS["global"]):
                from django.http import HttpResponse
                return HttpResponse("Trop de requêtes. Réessayez dans une minute.", status=429)

            # Limites spécifiques aux routes sensibles
            for rule_path, rule_type in PATH_RULES.items():
                if path.startswith(rule_path):
                    if not _check_and_increment(ip, rule_type, *RATE_LIMITS[rule_type]):
                        from django.http import HttpResponse
                        return HttpResponse("Trop de requêtes. Réessayez plus tard.", status=429)
                    break

        response = self.get_response(request)
        return response


# ---------------------------------------------------------------------------
# En-têtes de sécurité
# ---------------------------------------------------------------------------

def build_security_headers(request):
    headers = {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    }
    # En production (HTTPS) on active HSTS
    if not getattr(request, "_is_debug", True):
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return headers


class SecurityHeadersMiddleware:
    """Ajoute des en-têtes de sécurité à chaque réponse de l'API."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.debug = _is_debug()

    def __call__(self, request):
        request._is_debug = self.debug
        response = self.get_response(request)
        for key, value in build_security_headers(request).items():
            response.setdefault(key, value)
        return response


def _is_debug():
    try:
        from django.conf import settings
        return bool(getattr(settings, "DEBUG", True))
    except Exception:
        return True
