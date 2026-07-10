function Chatbot({
  open,
  messages,
  input,
  loading,
  error,
  onToggle,
  onClose,
  onInputChange,
  onSubmit,
}) {
  return (
    <section className={`chatbot ${open ? 'open' : ''}`} aria-label="AI 聊天小幫手">
      {open && (
        <article className="chatbot-panel">
          <header className="chatbot-header">
            <div>
              <strong>小翔 AI 小幫手</strong>
              <span>可查詢預約時段與餐廳資訊</span>
            </div>
            <button type="button" aria-label="關閉 AI 聊天小幫手" onClick={onClose}>
              ×
            </button>
          </header>

          <div className="chatbot-messages" aria-live="polite">
            {messages.map((entry, index) => (
              <div className={`chatbot-message ${entry.role}`} key={`${entry.role}-${index}`}>
                {entry.text}
              </div>
            ))}
            {loading && <div className="chatbot-message assistant">正在確認資訊...</div>}
          </div>

          {error && <p className="chatbot-error">{error}</p>}

          <form className="chatbot-form" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="chatbot-input">
              輸入想詢問小翔 AI 小幫手的問題
            </label>
            <input
              id="chatbot-input"
              type="text"
              value={input}
              placeholder="例如：5/14 還有哪些時段可以預約？"
              disabled={loading}
              onChange={(event) => onInputChange(event.target.value)}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              送出
            </button>
          </form>
        </article>
      )}

      <button
        className="chatbot-toggle"
        type="button"
        aria-expanded={open}
        aria-label="開啟 AI 聊天小幫手"
        onClick={onToggle}
      >
        AI
      </button>
    </section>
  );
}

export default Chatbot;
