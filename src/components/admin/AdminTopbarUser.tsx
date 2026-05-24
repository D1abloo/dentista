import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, KeyRound, LogOut, MapPin, Settings, Trash2, UserCircle } from 'lucide-react';
import { useLogout } from '@/components/auth/RoleGate';
import { useAdminSession } from '@/hooks/useAdminSession';
import { useNotice } from '@/hooks/useNotice';
import { clearStaffAvatarUrl, fileToAvatarDataUrl, saveStaffAvatarUrl } from '@/lib/staffAvatar';

type Props = {
  fallbackName?: string;
};

export function AdminTopbarUser({ fallbackName }: Props) {
  const logout = useLogout();
  const { setNotice } = useNotice();
  const { displayName, email, roleLabel, initials, avatarUrl, tenantId, clinicId, refreshAvatar } =
    useAdminSession(fallbackName);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      saveStaffAvatarUrl(dataUrl, clinicId, tenantId);
      refreshAvatar();
      setNotice({ type: 'ok', message: 'Foto de perfil actualizada.' });
    } catch (e) {
      setNotice({
        type: 'error',
        message: e instanceof Error ? e.message : 'No se pudo guardar la imagen.'
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removeAvatar() {
    clearStaffAvatarUrl(clinicId, tenantId);
    refreshAvatar();
    setOpen(false);
    setNotice({ type: 'ok', message: 'Foto de perfil eliminada.' });
  }

  return (
    <div className={`admin-user-menu${open ? ' admin-user-menu--open' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="admin-user-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-user-menu__photo" aria-hidden>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" width={44} height={44} />
          ) : (
            <span className="admin-user-menu__initials">{initials}</span>
          )}
          <span className="admin-user-menu__badge" title="Cambiar foto">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </span>
        <span className="admin-user-menu__meta">
          <strong>{displayName}</strong>
          <small>{roleLabel}</small>
        </span>
        <ChevronDown className="admin-user-menu__chev h-4 w-4" aria-hidden />
      </button>

      {open ? (
        <div className="admin-user-menu__panel" role="menu">
          <div className="admin-user-menu__panel-head">
            <span className="admin-user-menu__panel-photo">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={56} height={56} />
              ) : (
                <span className="admin-user-menu__initials admin-user-menu__initials--lg">{initials}</span>
              )}
            </span>
            <div>
              <p className="admin-user-menu__panel-name">{displayName}</p>
              {email ? <p className="admin-user-menu__panel-email">{email}</p> : null}
              <p className="admin-user-menu__panel-role">{roleLabel}</p>
            </div>
          </div>
          <ul className="admin-user-menu__list">
            <li>
              <button type="button" role="menuitem" onClick={() => fileRef.current?.click()}>
                <Camera className="h-4 w-4" aria-hidden />
                Cambiar foto de perfil
              </button>
            </li>
            {avatarUrl ? (
              <li>
                <button type="button" role="menuitem" className="admin-user-menu__danger" onClick={removeAvatar}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Quitar foto
                </button>
              </li>
            ) : null}
            <li>
              <a href="/admin/elegir-centro" role="menuitem">
                <MapPin className="h-4 w-4" aria-hidden />
                Cambiar centro
              </a>
            </li>
            <li>
              <a href="/admin/configuracion" role="menuitem">
                <Settings className="h-4 w-4" aria-hidden />
                Mi perfil y clínica
              </a>
            </li>
            <li>
              <a href="/login/cambiar-password?optional=1" role="menuitem">
                <KeyRound className="h-4 w-4" aria-hidden />
                Cambiar contraseña
              </a>
            </li>
            <li>
              <a href="/ayuda#panel-admin" role="menuitem">
                <UserCircle className="h-4 w-4" aria-hidden />
                Guía de uso
              </a>
            </li>
            <li className="admin-user-menu__sep" />
            <li>
              <button type="button" role="menuitem" className="admin-user-menu__danger" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden />
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
