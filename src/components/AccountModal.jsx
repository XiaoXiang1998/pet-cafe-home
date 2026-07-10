function AccountModal({ open, title, onClose, children, authMessage }) {
  if (!open) return null;

  return (
    <>
      <button
        className="account-backdrop"
        type="button"
        aria-label="關閉會員登入視窗"
        onClick={onClose}
      />
      <section
        className="account-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accountDialogTitle"
      >
        <div className="account-panel-head">
          <div>
            <p className="panel-kicker">Member</p>
            <h2 id="accountDialogTitle">{title}</h2>
          </div>
          <button type="button" aria-label="關閉會員登入視窗" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        {authMessage && <small className="auth-message">{authMessage}</small>}
      </section>
    </>
  );
}

export default AccountModal;
