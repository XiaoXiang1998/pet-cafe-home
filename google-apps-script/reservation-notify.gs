const SECRET = '請換成你自己的密碼字串';
const ADMIN_EMAIL = 'xiangazi319@gmail.com';

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');

    if (payload.secret !== SECRET) {
      return jsonOutput({ error: 'unauthorized' });
    }

    const reservation = payload.reservation || {};
    const subject = `小翔動物友善餐廳新預約：${reservation.date || ''} ${reservation.time || ''}`;
    const body = [
      '有新的預約：',
      '',
      `姓名：${reservation.name || '-'}`,
      `日期：${reservation.date || '-'}`,
      `時間：${reservation.time || '-'}`,
      `電話：${reservation.phone || '-'}`,
      `人數：${reservation.people || '-'}`,
      `寵物：${reservation.pet || '-'}`,
      `狀態：${reservation.status || '-'}`,
      `建立時間：${reservation.createdAt || '-'}`,
      '',
      '請登入網站後台確認與更新狀態。',
    ].join('\n');

    GmailApp.sendEmail(ADMIN_EMAIL, subject, body, {
      name: '小翔動物友善餐廳',
    });

    return jsonOutput({ status: 'sent' });
  } catch (error) {
    return jsonOutput({ error: error.message || 'send_failed' });
  }
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
