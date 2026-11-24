import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Award,
  CheckCircle2,
  Clock,
  Crown,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { SPEEDY_BURGER_LOGO } from '../data/logo';
import {
  BurgerClubMemberRecord,
  formatCurrency,
  OrderRecord,
  SiteSettings,
} from '../data/siteConfig';
import { selfJoinBurgerClub, updateSelfBurgerClubProfile } from '../services/storefrontService';

export type CustomerSheetTab = 'about' | 'contact' | 'club' | 'orders';

export function SplashScreenOverlay({
  settings,
  onEnter,
}: {
  settings: SiteSettings;
  onEnter: () => void;
}) {
  const logoSrc = settings.logoUrl || SPEEDY_BURGER_LOGO;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: settings.darkMode
          ? 'radial-gradient(circle at 50% 35%, #32180c 0%, #160a05 70%)'
          : `radial-gradient(circle at 50% 35%, ${settings.accentColor}33 0%, ${settings.backgroundColor} 75%)`,
        color: settings.darkMode ? '#fffaf2' : settings.textColor,
      }}
    >
      <div className="max-w-md w-full rounded-3xl border border-current/15 bg-white/90 dark:bg-[#2a140c]/95 backdrop-blur-md p-7 shadow-2xl text-center space-y-5 text-[#3a0b08]">
        <div className="flex justify-center">
          <img
            src={settings.splashImageUrl || logoSrc}
            alt={settings.shopName}
            className="h-24 w-auto max-w-[220px] rounded-2xl object-contain shadow-md"
          />
        </div>
        <div className="space-y-2">
          <h2
            className="font-display text-4xl leading-none"
            style={{ color: settings.brandColor }}
          >
            {settings.splashTitle || settings.shopName}
          </h2>
          <p className="text-sm font-semibold opacity-80">
            {settings.splashTagline || settings.tagline}
          </p>
        </div>
        <button
          type="button"
          onClick={onEnter}
          className="w-full py-3.5 px-6 rounded-2xl font-display text-2xl text-white shadow-lg cursor-pointer transition-transform active:scale-[0.98]"
          style={{ backgroundColor: settings.brandColor }}
        >
          {settings.splashCtaText || 'Start Building'}
        </button>
      </div>
    </div>
  );
}

export function OrderTicketCard({
  ticket,
  settings,
  whatsappUrl,
  onBack,
}: {
  ticket: OrderRecord;
  settings: SiteSettings;
  whatsappUrl: string;
  onBack: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-current/25 p-4 space-y-3 bg-white/60 text-[#3a0b08]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-65">
            {settings.ticketHeading || 'Your ticket'}
          </div>
          <div
            className="font-display text-3xl leading-none tabular-nums"
            style={{ color: settings.brandColor }}
          >
            #{ticket.ticketCode}
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase"
          style={{
            backgroundColor: settings.accentColor,
            color: '#3a0b08',
          }}
        >
          {ticket.status}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs border-y border-current/12 py-2">
        <span className="inline-flex items-center gap-1.5 font-semibold opacity-80">
          <Clock className="w-3.5 h-3.5" />
          {settings.ticketWaitLabel || 'Estimated wait'}
        </span>
        <span className="font-bold tabular-nums">~{settings.estimatedWaitMins} min · {ticket.orderMode}</span>
      </div>

      <div className="space-y-1 text-xs">
        {ticket.comboName && (
          <div className="font-bold">{ticket.comboName}</div>
        )}
        {ticket.items.map((line, i) => (
          <div key={i} className="opacity-85">
            • {line}
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-current/12 font-bold text-sm">
          <span>Total</span>
          <span className="tabular-nums" style={{ color: settings.brandColor }}>
            {formatCurrency(ticket.total, settings.currencySymbol)}
          </span>
        </div>
      </div>

      {ticket.ticketCode && settings.ticketFooterNote && (
        <p className="text-[11px] opacity-70">{settings.ticketFooterNote}</p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-display text-lg leading-none shadow-sm"
          style={{ backgroundColor: settings.brandColor }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{settings.ticketWhatsappText || 'Send on WhatsApp'}</span>
        </a>
        <button
          type="button"
          onClick={onBack}
          className="py-2 px-3 rounded-xl border border-current/20 text-xs font-bold cursor-pointer hover:bg-black/5"
        >
          {settings.ticketBackText || 'Back to menu'}
        </button>
      </div>
    </div>
  );
}

export function CustomerInfoModal({
  initialTab,
  settings,
  user,
  clubMember,
  userOrders,
  onSignIn,
  onSignOut,
  onClose,
}: {
  initialTab: CustomerSheetTab;
  settings: SiteSettings;
  user: User | null;
  clubMember: BurgerClubMemberRecord | null;
  userOrders: OrderRecord[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<CustomerSheetTab>(initialTab);
  const [nameInput, setNameInput] = useState(clubMember?.name || user?.displayName || '');
  const [phoneInput, setPhoneInput] = useState(clubMember?.phone || '');
  const [savingClub, setSavingClub] = useState(false);
  const [clubMsg, setClubMsg] = useState<string | null>(null);

  const handleJoinOrUpdateClub = async () => {
    if (!user) return;
    setSavingClub(true);
    setClubMsg(null);
    try {
      if (!clubMember) {
        await selfJoinBurgerClub(user, nameInput || user.displayName || 'Burger Lover', phoneInput || '876-000-0000');
        setClubMsg('Joined Burger Club! Your digital stamp card is active.');
      } else {
        await updateSelfBurgerClubProfile(
          user.uid,
          nameInput || clubMember.name,
          phoneInput || clubMember.phone,
          user.email || clubMember.email
        );
        setClubMsg('Updated your Burger Club contact info.');
      }
    } catch (e) {
      setClubMsg(e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setSavingClub(false);
    }
  };

  const stampsNeeded = Math.max(1, settings.ordersNeededForReward);
  const stampsCurrent = clubMember ? Math.min(stampsNeeded, clubMember.stamps) : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#fffaf2] text-[#3a0b08] border border-[#3a0b08]/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#3a0b08]/12 bg-white/70">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={settings.logoUrl || SPEEDY_BURGER_LOGO}
              alt={settings.shopName}
              className="h-7 w-auto rounded-md object-contain"
            />
            <span className="font-display text-xl truncate" style={{ color: settings.brandColor }}>
              {settings.shopName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full border border-[#3a0b08]/15 flex items-center justify-center hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#3a0b08]/10 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'about', label: 'About', icon: Store },
              { id: 'contact', label: 'Contact', icon: MapPin },
              ...(settings.clubEnabled
                ? [{ id: 'club' as const, label: settings.tabClub || 'Burger Club', icon: Award }]
                : []),
              { id: 'orders', label: settings.tabOrders || 'My Orders', icon: Receipt },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                tab === id ? 'text-white shadow-sm' : 'bg-black/5 opacity-75 hover:opacity-100'
              }`}
              style={tab === id ? { backgroundColor: settings.brandColor } : undefined}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {tab === 'about' && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl" style={{ color: settings.brandColor }}>
                {settings.aboutHeading || `About ${settings.shopName}`}
              </h3>
              {settings.aboutHighlight && (
                <div
                  className="rounded-xl p-3 text-xs font-bold border"
                  style={{
                    backgroundColor: `${settings.accentColor}28`,
                    borderColor: `${settings.accentColor}88`,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                  {settings.aboutHighlight}
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-line opacity-85">
                {settings.aboutBody}
              </p>
            </div>
          )}

          {tab === 'contact' && (
            <div className="space-y-3">
              <h3 className="font-display text-2xl" style={{ color: settings.brandColor }}>
                {settings.contactHeading || 'Contact & Hours'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-[#3a0b08]/12 bg-white p-3 space-y-1">
                  <div className="font-bold opacity-60 uppercase text-[10px]">Phone / WhatsApp</div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{ color: settings.brandColor }} />
                    <span>{settings.contactPhone}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#3a0b08]/12 bg-white p-3 space-y-1">
                  <div className="font-bold opacity-60 uppercase text-[10px]">Email</div>
                  <div className="font-bold break-all">{settings.contactEmail}</div>
                </div>
                <div className="rounded-xl border border-[#3a0b08]/12 bg-white p-3 space-y-1">
                  <div className="font-bold opacity-60 uppercase text-[10px]">Location</div>
                  <div className="font-bold">{settings.contactAddress}</div>
                </div>
                <div className="rounded-xl border border-[#3a0b08]/12 bg-white p-3 space-y-1">
                  <div className="font-bold opacity-60 uppercase text-[10px]">Opening Hours</div>
                  <div className="font-bold">{settings.contactHours}</div>
                </div>
              </div>
              {settings.contactNote && (
                <p className="text-xs opacity-80 rounded-xl bg-black/5 p-3">{settings.contactNote}</p>
              )}
            </div>
          )}

          {tab === 'club' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 text-white shadow-md space-y-2" style={{ backgroundColor: settings.brandColor }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-2xl leading-none">
                    {settings.tabClub || 'Burger Club'}
                  </div>
                  {clubMember?.firstInLine && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#3a0b08]"
                      style={{ backgroundColor: settings.crownColor }}
                    >
                      <Crown className="w-3.5 h-3.5" /> First in Line
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90">
                  Collect {stampsNeeded} orders to unlock <strong>{settings.rewardText}</strong>.
                  Priority First in Line pass: {formatCurrency(settings.membershipPrice, settings.currencySymbol)}.
                </p>
              </div>

              {!user ? (
                <div className="rounded-2xl border border-[#3a0b08]/12 bg-white p-4 text-center space-y-3">
                  <p className="text-xs opacity-80">
                    Sign in with Google to view your {settings.tabCard || 'My card'} stamps and track rewards.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[#3a0b08]/12 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase opacity-65">
                        {settings.tabCard || 'My card'} Progress
                      </span>
                      <span className="font-display text-xl tabular-nums" style={{ color: settings.brandColor }}>
                        {stampsCurrent} / {stampsNeeded}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {Array.from({ length: stampsNeeded }).map((_, idx) => {
                        const filled = idx < stampsCurrent;
                        return (
                          <div
                            key={idx}
                            className={`h-9 rounded-xl border flex items-center justify-center text-xs font-bold ${
                              filled
                                ? 'text-white border-transparent'
                                : 'border-dashed border-[#3a0b08]/20 opacity-45'
                            }`}
                            style={filled ? { backgroundColor: settings.brandColor } : undefined}
                          >
                            {filled ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                        );
                      })}
                    </div>
                    {clubMember && (
                      <div className="text-[11px] opacity-70 flex items-center justify-between pt-1">
                        <span>Lifetime orders: {clubMember.lifetimeOrders}</span>
                        <span>Rewards claimed: {clubMember.rewardsRedeemed}</span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#3a0b08]/12 bg-white p-4 space-y-2.5">
                    <div className="text-xs font-bold">
                      {clubMember ? 'Update Member Contact' : 'Activate Your Digital Card'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your name"
                        maxLength={80}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-[#3a0b08]/15 text-xs bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="Phone (e.g. 876-555-1234)"
                        maxLength={30}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-[#3a0b08]/15 text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={savingClub}
                        onClick={() => void handleJoinOrUpdateClub()}
                        className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                        style={{ backgroundColor: settings.brandColor }}
                      >
                        {savingClub ? 'Saving...' : clubMember ? 'Save Details' : 'Join Burger Club'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void onSignOut()}
                        className="inline-flex items-center gap-1 text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                    {clubMsg && <p className="text-xs font-semibold text-emerald-700">{clubMsg}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl" style={{ color: settings.brandColor }}>
                  {settings.tabOrders || 'Your Orders'}
                </h3>
                {user && (
                  <span className="text-[11px] opacity-65 truncate max-w-[180px]">
                    {user.email}
                  </span>
                )}
              </div>

              {!user ? (
                <div className="rounded-2xl border border-[#3a0b08]/12 bg-white p-4 text-center space-y-3">
                  <p className="text-xs opacity-80">
                    Sign in with Google to view your saved order tickets and live kitchen status.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignIn()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: settings.brandColor }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="rounded-2xl border border-[#3a0b08]/12 bg-white p-5 text-center text-xs opacity-70">
                  No orders yet. Build a burger or pick a combo to place your first order!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-[#3a0b08]/12 bg-white p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg" style={{ color: settings.brandColor }}>
                          #{ord.ticketCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/8 text-[11px] font-bold uppercase">
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-xs opacity-80">
                        {ord.orderMode} · {ord.items.join(', ')}
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold pt-1">
                        <span>{ord.staffNote ? `Kitchen: ${ord.staffNote}` : ''}</span>
                        <span className="tabular-nums">
                          {formatCurrency(ord.total, settings.currencySymbol)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#3a0b08]/10 bg-white/60 text-center text-[11px] opacity-75">
          <div>{settings.footerText}</div>
          {settings.footerSubtext && <div className="opacity-75">{settings.footerSubtext}</div>}
        </div>
      </div>
    </div>
  );
}
