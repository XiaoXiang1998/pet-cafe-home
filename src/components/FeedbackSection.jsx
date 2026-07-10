function FeedbackSection({
  filters,
  feedbackFilter,
  feedbackForm,
  feedbackMessage,
  feedbackEntries,
  feedbackPageCount,
  currentFeedbackPage,
  onFilterChange,
  onFormChange,
  onSubmit,
  onPageChange,
}) {
  return (
    <section className="feedback-section" id="feedback">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Reviews & Complaints</p>
          <h2>評論與客訴</h2>
        </div>
        <div className="feedback-filter" aria-label="回饋篩選">
          {filters.map((filter) => (
            <button
              className={feedbackFilter === filter.value ? 'active' : ''}
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="feedback-layout">
        <article className="feedback-card">
          <h3>留下回饋</h3>
          <form onSubmit={onSubmit}>
            <label>
              類型
              <select
                value={feedbackForm.type}
                onChange={(event) => onFormChange({ type: event.target.value })}
              >
                <option value="review">評論</option>
                <option value="complaint">客訴</option>
              </select>
            </label>

            <label>
              評分
              <div className="rating-stars" role="radiogroup" aria-label="評分星等">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    className={score <= feedbackForm.rating ? 'active' : ''}
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={feedbackForm.rating === score}
                    onClick={() => onFormChange({ rating: score })}
                  >
                    ★
                  </button>
                ))}
                <span>{feedbackForm.rating} / 5</span>
              </div>
            </label>

            <label>
              內容
              <textarea
                rows="5"
                value={feedbackForm.message}
                onChange={(event) => onFormChange({ message: event.target.value })}
                placeholder="請輸入評論或客訴內容"
              />
            </label>

            <button type="submit">送出回饋</button>
          </form>
          {feedbackMessage && <p className="feedback-message">{feedbackMessage}</p>}
        </article>

        <div className="feedback-list" aria-label="評論與客訴列表">
          {feedbackEntries.map((entry) => (
            <article className="feedback-item" key={entry.id}>
              <div className="feedback-item-head">
                <span className={entry.type === 'complaint' ? 'tag complaint' : 'tag'}>
                  {entry.type === 'complaint' ? '客訴' : '評論'}
                </span>
                <div className="readonly-stars" aria-label={`${entry.rating} 顆星`}>
                  {'★'.repeat(entry.rating)}
                </div>
              </div>
              <h3>{entry.name}</h3>
              <p>{entry.message}</p>
            </article>
          ))}
          {feedbackPageCount > 1 && (
            <nav className="feedback-pagination" aria-label="評論分頁">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentFeedbackPage - 1))}
                disabled={currentFeedbackPage === 1}
              >
                上一頁
              </button>
              <div className="feedback-page-numbers">
                {Array.from({ length: feedbackPageCount }, (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      className={page === currentFeedbackPage ? 'active' : ''}
                      key={page}
                      type="button"
                      aria-label={`第 ${page} 頁`}
                      aria-current={page === currentFeedbackPage ? 'page' : undefined}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(feedbackPageCount, currentFeedbackPage + 1))}
                disabled={currentFeedbackPage === feedbackPageCount}
              >
                下一頁
              </button>
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeedbackSection;
