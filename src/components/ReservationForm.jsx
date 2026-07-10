import { isAvailabilitySlotOpen } from '../lib/reservations';

function ReservationForm({
  minDate,
  reservation,
  reservationMessage,
  timeOptions,
  availabilityByTime,
  availabilityLoading,
  availabilityError,
  onReservationChange,
  onSubmit,
}) {
  const getTimeLabel = (time) => {
    const slot = availabilityByTime[time];
    if (!reservation.date || !slot) return time;
    if (!isAvailabilitySlotOpen(slot)) return `${time}（已滿）`;
    return `${time}（剩 ${slot.remaining_count} 組）`;
  };

  return (
    <article className="reservation-card" id="reserve">
      <p className="section-kicker">Reservation</p>
      <h2>預約訂位</h2>
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <label>
            日期
            <input
              type="date"
              min={minDate}
              value={reservation.date}
              onChange={(event) => onReservationChange({ date: event.target.value, time: '' })}
            />
          </label>
          <label>
            時段
            <select
              value={reservation.time}
              onChange={(event) => onReservationChange({ time: event.target.value })}
            >
              <option value="">請選擇預約時段</option>
              {timeOptions.map((time) => {
                const slot = availabilityByTime[time];
                const disabled = reservation.date && slot && !isAvailabilitySlotOpen(slot);

                return (
                  <option value={time} key={time} disabled={disabled}>
                    {getTimeLabel(time)}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        {reservation.date && (
          <div className="slot-status" aria-live="polite">
            {availabilityLoading && '正在讀取可預約名額...'}
            {!availabilityLoading && availabilityError}
            {!availabilityLoading && !availabilityError && '名額會依目前資料庫預約狀態即時顯示。'}
          </div>
        )}

        <label>
          聯絡電話
          <input
            type="tel"
            inputMode="tel"
            value={reservation.phone}
            onChange={(event) => onReservationChange({ phone: event.target.value })}
            placeholder="例如：0912-345-678"
          />
        </label>
        <div className="field-row">
          <label>
            人數
            <select
              value={reservation.people}
              onChange={(event) => onReservationChange({ people: event.target.value })}
            >
              <option value="1">1 位</option>
              <option value="2">2 位</option>
              <option value="3">3 位</option>
              <option value="4">4 位</option>
              <option value="5">5 位以上</option>
            </select>
          </label>
          <label>
            攜帶寵物
            <select
              value={reservation.pet}
              onChange={(event) => onReservationChange({ pet: event.target.value })}
            >
              <option value="dog">狗狗</option>
              <option value="cat">貓貓</option>
              <option value="both">貓貓與狗狗</option>
              <option value="none">不攜帶寵物</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={availabilityLoading}>
          送出預約
        </button>
      </form>
      {reservationMessage && <p className="reservation-message">{reservationMessage}</p>}
    </article>
  );
}

export default ReservationForm;
