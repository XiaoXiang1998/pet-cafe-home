import { useMemo, useState } from 'react';

const getMonthKey = (dateText) => (dateText ? dateText.slice(0, 7) : new Date().toISOString().slice(0, 7));

const buildMonthDays = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return `${monthKey}-${day}`;
  });
};

function AdminDashboard({
  tabs,
  activeTab,
  message,
  reservations,
  selectedDate,
  reservationStatuses,
  feedbackStatuses,
  feedbacks,
  profiles,
  menuItems,
  menuForm,
  petLabels,
  createEmptyMenuForm,
  menuFormFromItem,
  onTabChange,
  onSelectedDateChange,
  onReservationStatusChange,
  onFeedbackUpdate,
  onMenuSubmit,
  onMenuFormChange,
}) {
  const [calendarMonth, setCalendarMonth] = useState(getMonthKey(selectedDate));
  const [reservationView, setReservationView] = useState('month');
  const monthDays = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth]);
  const reservationCountByDate = useMemo(
    () =>
      reservations.reduce((counts, item) => {
        counts[item.reserve_date] = (counts[item.reserve_date] ?? 0) + 1;
        return counts;
      }, {}),
    [reservations],
  );
  const selectedReservations = reservations.filter((item) => item.reserve_date === selectedDate);
  const monthReservations = reservations.filter((item) => item.reserve_date?.startsWith(calendarMonth));
  const visibleReservations = reservationView === 'month' ? monthReservations : selectedReservations;
  const reservationViewTitle = reservationView === 'month' ? `${calendarMonth} 全部預約` : `${selectedDate} 預約明細`;

  const handleMonthChange = (value) => {
    setCalendarMonth(value);
    if (!value) return;
    setReservationView('month');
    onSelectedDateChange(`${value}-01`);
  };

  return (
    <section className="admin-section" id="admin">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Admin Console</p>
          <h2>後台管理</h2>
        </div>
        <div className="admin-tabs" role="tablist" aria-label="後台分頁">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.value ? 'active' : ''}
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="admin-message">{message}</p>}

      {activeTab === 'reservations' && (
        <div className="admin-calendar-layout">
          <article className="admin-card admin-calendar-card">
            <label>
              月份
              <input type="month" value={calendarMonth} onChange={(event) => handleMonthChange(event.target.value)} />
            </label>
            <div className="admin-calendar-grid" aria-label="預約月曆">
              {monthDays.map((dateText) => (
                <button
                  className={selectedDate === dateText ? 'active' : ''}
                  key={dateText}
                  type="button"
                  onClick={() => {
                    setReservationView('day');
                    onSelectedDateChange(dateText);
                  }}
                >
                  <strong>{Number(dateText.slice(-2))}</strong>
                  <span>{reservationCountByDate[dateText] ?? 0} 筆</span>
                </button>
              ))}
            </div>
          </article>

          <div className="admin-grid">
            <article className="admin-card admin-reservation-summary">
              <div>
                <h3>{reservationViewTitle}</h3>
                <p>
                  {reservationView === 'month'
                    ? `本月共 ${monthReservations.length} 筆；點選月曆日期可查看當日明細。`
                    : `當日共 ${selectedReservations.length} 筆；可切換回本月全部預約。`}
                </p>
              </div>
              <div className="admin-tabs" aria-label="預約檢視範圍">
                <button
                  className={reservationView === 'month' ? 'active' : ''}
                  type="button"
                  onClick={() => setReservationView('month')}
                >
                  本月全部 ({monthReservations.length})
                </button>
                <button
                  className={reservationView === 'day' ? 'active' : ''}
                  type="button"
                  onClick={() => setReservationView('day')}
                >
                  當日明細 ({selectedReservations.length})
                </button>
              </div>
            </article>

            {visibleReservations.length === 0 && (
              <article className="admin-card">
                <h3>{reservationViewTitle}</h3>
                <p>{reservationView === 'month' ? '這個月目前沒有預約。' : '這一天目前沒有預約。'}</p>
              </article>
            )}
            {visibleReservations.map((item) => (
              <article className="admin-card" key={item.id}>
                <div>
                  <span className="tag">{item.status}</span>
                  <h3>{item.user_name}</h3>
                  <p>
                    {item.reserve_date} {String(item.reserve_time).slice(0, 5)} / {item.people} 位 /{' '}
                    {petLabels[item.pet] ?? item.pet}
                  </p>
                  <p>電話：{item.phone || '未填寫'}</p>
                </div>
                <select
                  value={item.status}
                  onChange={(event) => onReservationStatusChange(item.id, event.target.value)}
                >
                  {reservationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'feedbacks' && (
        <div className="admin-grid">
          {feedbacks.map((entry) => (
            <article className="admin-card" key={entry.id}>
              <div>
                <span className={entry.type === 'complaint' ? 'tag complaint' : 'tag'}>
                  {entry.type === 'complaint' ? '客訴' : '評論'}
                </span>
                <h3>{entry.user_name}</h3>
                <p>{entry.message}</p>
              </div>
              <div className="admin-controls">
                <label>
                  狀態
                  <select
                    value={entry.status ?? 'new'}
                    onChange={(event) => onFeedbackUpdate(entry.id, { status: event.target.value })}
                  >
                    {feedbackStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  處理備註
                  <textarea
                    rows="3"
                    defaultValue={entry.admin_notes ?? ''}
                    onBlur={(event) => onFeedbackUpdate(entry.id, { admin_notes: event.target.value })}
                    placeholder="記錄處理方式或後續追蹤"
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    checked={entry.is_visible ?? true}
                    type="checkbox"
                    onChange={(event) =>
                      onFeedbackUpdate(entry.id, {
                        is_visible: event.target.checked,
                      })
                    }
                  />
                  公開顯示
                </label>
                {entry.handled_at && <small>處理時間：{new Date(entry.handled_at).toLocaleString()}</small>}
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="admin-grid">
          {profiles.map((member) => (
            <article className="admin-card" key={member.id}>
              <span className="tag">{member.role}</span>
              <h3>{member.nickname || '未命名會員'}</h3>
              <p>{member.email}</p>
              <p>建立時間：{member.created_at ? new Date(member.created_at).toLocaleString() : '-'}</p>
            </article>
          ))}
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="admin-menu-layout">
          <article className="admin-card">
            <h3>{menuForm.id ? '編輯菜單品項' : '新增菜單品項'}</h3>
            <form onSubmit={onMenuSubmit}>
              <div className="field-row">
                <label>
                  中文名稱
                  <input value={menuForm.zhName} onChange={(event) => onMenuFormChange({ zhName: event.target.value })} />
                </label>
                <label>
                  英文名稱
                  <input value={menuForm.enName} onChange={(event) => onMenuFormChange({ enName: event.target.value })} />
                </label>
              </div>
              <label>
                中文描述
                <textarea
                  value={menuForm.zhDescription}
                  onChange={(event) => onMenuFormChange({ zhDescription: event.target.value })}
                />
              </label>
              <label>
                英文描述
                <textarea
                  value={menuForm.enDescription}
                  onChange={(event) => onMenuFormChange({ enDescription: event.target.value })}
                />
              </label>
              <label>
                日文名稱
                <input value={menuForm.jaName} onChange={(event) => onMenuFormChange({ jaName: event.target.value })} />
              </label>
              <label>
                日文描述
                <textarea
                  value={menuForm.jaDescription}
                  onChange={(event) => onMenuFormChange({ jaDescription: event.target.value })}
                />
              </label>
              <div className="field-row">
                <label>
                  價格
                  <input
                    min="0"
                    type="number"
                    value={menuForm.price}
                    onChange={(event) => onMenuFormChange({ price: event.target.value })}
                  />
                </label>
                <label>
                  排序
                  <input
                    type="number"
                    value={menuForm.sortOrder}
                    onChange={(event) => onMenuFormChange({ sortOrder: event.target.value })}
                  />
                </label>
              </div>
              <label>
                圖片 URL
                <input value={menuForm.image} onChange={(event) => onMenuFormChange({ image: event.target.value })} />
              </label>
              <label className="checkbox-row">
                <input
                  checked={menuForm.isActive}
                  type="checkbox"
                  onChange={(event) => onMenuFormChange({ isActive: event.target.checked })}
                />
                公開上架
              </label>
              <div className="admin-form-actions">
                <button type="submit">{menuForm.id ? '更新品項' : '新增品項'}</button>
                {menuForm.id && (
                  <button type="button" onClick={() => onMenuFormChange(createEmptyMenuForm(), true)}>
                    取消編輯
                  </button>
                )}
              </div>
            </form>
          </article>

          <div className="admin-grid">
            {menuItems.map((item) => (
              <article className="admin-card" key={item.id}>
                <span className={item.isActive ? 'tag' : 'tag complaint'}>
                  {item.isActive ? '上架' : '隱藏'}
                </span>
                <h3>{item.labels.zh.name}</h3>
                <p>NT$ {item.price} / 排序 {item.sortOrder}</p>
                <button type="button" onClick={() => onMenuFormChange(menuFormFromItem(item), true)}>
                  編輯
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
