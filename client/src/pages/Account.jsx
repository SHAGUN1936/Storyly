import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import celebrate from '../lib/celebrate';
import { APP_INPUT_BIG } from '../lib/uiClasses';
import PasswordField from '../components/PasswordField';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import MagneticButton from '../ui/MagneticButton';
import { fadeUp, stagger } from '../motion/variants';

/* ── Preset avatars ────────────────────────────────────────────────────
   Each preset is a tiny SVG (gradient pill + an emoji glyph). Stored as
   a data URI so the existing `<img src={avatar}>` rendering everywhere
   else (topbar, comments, TemplateCard) just works — no schema changes. */
const PRESET_AVATARS = [
  { emoji: '🌸', from: '#FBCFE8', to: '#EC4899' },
  { emoji: '🦄', from: '#EDE9FE', to: '#8B5CF6' },
  { emoji: '🍦', from: '#FECACA', to: '#FB7185' },
  { emoji: '🐰', from: '#FCE7F3', to: '#A78BFA' },
  { emoji: '🐱', from: '#FDE68A', to: '#FB923C' },
  { emoji: '🌈', from: '#A5F3FC', to: '#C4B5FD' },
  { emoji: '⭐', from: '#FEF3C7', to: '#F59E0B' },
  { emoji: '🍃', from: '#CCFBF1', to: '#14B8A6' },
  { emoji: '🍒', from: '#FBCFE8', to: '#BE185D' },
  { emoji: '🐼', from: '#EDE9FE', to: '#A78BFA' },
  { emoji: '🌙', from: '#DDD6FE', to: '#7C3AED' },
  { emoji: '🦋', from: '#BAE6FD', to: '#8B5CF6' },
];

function buildPresetDataUri({ emoji, from, to }) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0%" stop-color="${from}"/>` +
        `<stop offset="100%" stop-color="${to}"/>` +
      `</linearGradient></defs>` +
      `<rect width="100" height="100" fill="url(#g)"/>` +
      `<text x="50" y="55" font-size="56" text-anchor="middle" dominant-baseline="central" ` +
        `font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* Resize the user's photo to a small square data URL (256px JPEG @ 0.85).
   Saves bandwidth + DB space and keeps the avatar render fast. */
function resizeImageToDataUri(file, max = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(max / img.width, max / img.height, 1);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) { reject(err); }
    };
    img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
    img.src = url;
  });
}

export default function Account() {
  const { user, updateUser } = useAuth();

  // ── Profile form (name + avatar) ─────────────────────────
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { kind: 'ok' | 'err', text }

  const submitProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const { user: updated } = await authAPI.updateProfile({ name, avatar });
      updateUser({ name: updated.name, avatar: updated.avatar });
      toast.success('Profile saved');
      celebrate();
    } catch (err) {
      toast.error(err.message || 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password form ────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const submitPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords don’t match.');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password updated');
      celebrate('mint');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="mb-10">
        <GlassCard tone="strong" className="!rounded-[2rem] p-7 sm:p-10 relative overflow-hidden">
          <NeonOrb color="#A78BFA" size="20rem" style={{ top: '-5rem', right: '-5rem' }} opacity={0.4} />
          <NeonOrb color="#EC4899" size="18rem" style={{ bottom: '-4rem', left: '-3rem' }} opacity={0.35} />
          <div className="absolute inset-0 bg-grid-soft opacity-25 pointer-events-none" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Account</span></motion.span>
              <motion.h1 variants={fadeUp} className="section-title mt-5">
                Your <GradientText variant="cosmic">profile</GradientText>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-3 text-slate-300 max-w-xl leading-7">
                Update how you appear on shared pages, and change your password. Your email is locked because it identifies your account everywhere.
              </motion.p>
            </div>

            <div className="story-ring p-[3px] w-fit shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="bg-ink-900 w-20 h-20 rounded-full flex items-center justify-center font-display font-extrabold text-2xl text-white">
                  {user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Profile form */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <GlassCard className="p-7 sm:p-9">
          <h2 className="font-display text-xl font-extrabold text-white mb-1">Profile</h2>
          <p className="text-sm text-slate-400 mb-6">Edit your display name and avatar.</p>

          <form onSubmit={submitProfile} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className={`${APP_INPUT_BIG} !cursor-not-allowed !opacity-70`}
                title="Email is locked — it identifies your account"
              />
              <p className="mt-1.5 text-[10px] text-slate-500">Locked — your email is your unique identifier.</p>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={APP_INPUT_BIG}
                placeholder="What should we call you?"
                required
                maxLength={80}
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Profile picture
              </label>
              <AvatarPicker value={avatar} onChange={setAvatar} onError={(text) => setProfileMsg({ kind: 'err', text })} />
            </div>

            {profileMsg && <FormMessage msg={profileMsg} />}

            <div className="flex justify-end">
              <MagneticButton type="submit" variant="glow" disabled={savingProfile} className="!text-sm">
                {savingProfile ? 'Saving…' : 'Save profile'}
              </MagneticButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>

      {/* Password form */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
        <GlassCard className="p-7 sm:p-9">
          <h2 className="font-display text-xl font-extrabold text-white mb-1">Password</h2>
          <p className="text-sm text-slate-400 mb-6">
            Pick something memorable. Minimum 6 characters.
          </p>

          <form onSubmit={submitPassword} className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Current password</label>
              <PasswordField
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={APP_INPUT_BIG}
                placeholder="Your current password"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">New password</label>
              <PasswordField
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={APP_INPUT_BIG}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Confirm new password</label>
              <PasswordField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={APP_INPUT_BIG}
                placeholder="Re-enter the new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {passwordMsg && <FormMessage msg={passwordMsg} />}

            <div className="flex justify-end">
              <MagneticButton type="submit" variant="glow" disabled={savingPassword} className="!text-sm">
                {savingPassword ? 'Updating…' : 'Change password'}
              </MagneticButton>
            </div>
          </form>
        </GlassCard>
      </motion.div>

      {/* Receipts & billing entry — replaces the topbar receipts icon. */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6">
        <Link to="/receipts" className="block group">
          <GlassCard className="p-6 sm:p-7 flex items-center gap-5 hover-lift hover-lift-glow">
            <div
              className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 55%, #F9A8D4 100%)',
                boxShadow: '0 14px 30px -12px rgba(167,139,250,0.40)',
              }}
            >
              <ReceiptSparkleIcon />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-extrabold text-white">
                <GradientText variant="cosmic">Receipts</GradientText> &amp; billing
              </h3>
              <p className="mt-0.5 text-sm text-slate-400 leading-6">
                Every Marketplace template and Builder Program payment, with downloadable receipts.
              </p>
            </div>
            <div className="shrink-0 text-slate-500 group-hover:text-fuchsia-300 transition">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </GlassCard>
        </Link>
      </motion.div>
    </div>
  );
}

function ReceiptSparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3h11l3 3v15l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V4a1 1 0 0 1 1-1z" />
      <line x1="8" y1="9"  x2="15" y2="9" />
      <line x1="8" y1="13" x2="15" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function FormMessage({ msg }) {
  const tone = msg.kind === 'ok'
    ? 'border-teal-400/30 bg-teal-500/10 text-teal-200'
    : 'border-rose-400/30 bg-rose-500/10 text-rose-200';
  return (
    <p className={`rounded-xl border px-3 py-2 text-xs ${tone}`}>
      {msg.text}
    </p>
  );
}

/* ── Avatar picker ────────────────────────────────────────────────────
   • Grid of 12 preset avatars (gradient-tile + emoji glyph)
   • Upload tile: opens the file picker, resizes to 256px JPEG, stores
     as a data URI so the existing <img src={avatar}> rendering works.
   • Selected tile gets a violet ring + check badge.
   • Selecting "None" clears the avatar so the initials placeholder shows. */
function AvatarPicker({ value, onChange, onError }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const isPreset = (p) => value === buildPresetDataUri(p);
  // Anything that isn't a preset AND isn't empty → user's uploaded photo.
  const isCustom = !!value && !PRESET_AVATARS.some(isPreset);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('That file isn’t an image. Pick a JPG, PNG, or GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.('Photo is over 5MB. Pick a smaller one (we resize it for you).');
      return;
    }
    try {
      setUploading(true);
      const dataUri = await resizeImageToDataUri(file);
      onChange(dataUri);
    } catch {
      onError?.('Could not read that photo. Try a different file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2.5">
        {/* "None" — fall back to initials */}
        <PickerTile
          ariaLabel="No avatar (use initials)"
          selected={!value}
          onClick={() => onChange('')}
        >
          <div className="w-full h-full rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-400 text-xl">
            ⊘
          </div>
        </PickerTile>

        {/* Preset tiles */}
        {PRESET_AVATARS.map((p) => {
          const uri = buildPresetDataUri(p);
          return (
            <PickerTile
              key={p.emoji + p.from}
              ariaLabel={`Avatar ${p.emoji}`}
              selected={value === uri}
              onClick={() => onChange(uri)}
            >
              <img src={uri} alt="" className="w-full h-full rounded-2xl object-cover" />
            </PickerTile>
          );
        })}

        {/* Upload your own */}
        <PickerTile
          ariaLabel="Upload your own photo"
          selected={isCustom}
          onClick={() => fileInputRef.current?.click()}
        >
          {isCustom ? (
            <img src={value} alt="Your photo" className="w-full h-full rounded-2xl object-cover" />
          ) : (
            <div className="w-full h-full rounded-2xl border border-dashed border-white/25 bg-white/[0.04] flex flex-col items-center justify-center text-slate-300">
              {uploading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-[8px] uppercase tracking-[0.18em] font-bold mt-1">Upload</span>
                </>
              )}
            </div>
          )}
        </PickerTile>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Pick a preset or upload your own (we shrink it to 256px to keep things speedy).
      </p>
    </div>
  );
}

function PickerTile({ children, selected, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={`relative aspect-square rounded-2xl transition-[transform,box-shadow] duration-200 ease-out active:scale-95 ${
        selected
          ? 'ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-transparent shadow-[0_10px_22px_-10px_rgba(236,72,153,0.55)]'
          : 'hover:shadow-[0_8px_18px_-8px_rgba(139,92,246,0.40)]'
      }`}
    >
      {children}
      {selected && (
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[11px] font-extrabold flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #C4B5FD, #A78BFA 55%, #F9A8D4)',
            boxShadow: '0 4px 10px -2px rgba(167,139,250,0.40)',
          }}
        >
          ✓
        </span>
      )}
    </button>
  );
}
