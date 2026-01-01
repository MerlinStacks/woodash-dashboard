# Environment Configuration

## Required Files
- `.env` (Root) - Used by Docker Compose and `apps/api`.

## Variable Reference

### Database
| Variable | Description | Example |
| :--- | :--- | :--- |
| `POSTGRES_PASSWORD` | Root password for PostgreSQL container. | `securepassword` |
| `DATABASE_URL` | Connection string for API. | `postgresql://user:pass@db:5432/overseek` |

### Infrastructure
| Variable | Description | Example |
| :--- | :--- | :--- |
| `REDIS_URL` | Connection string for Redis queue/cache. | `redis://redis:6379` |
| `PORT` | API Server Port. | `4000` |

### Frontend Build (Vite)
| Variable | Desciprtion | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the backend API. | `http://localhost:4000` |

### Security
| Variable | Description |
| :--- | :--- |
| `COOKIE_SECRET` | Secret used to sign session cookies. **Must be changed in prod.** |
