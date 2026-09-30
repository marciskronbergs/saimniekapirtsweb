// The bus timetable from Riga to the "Dzimtmisa" stop, where we collect
// guests who come by bus.
export const busTimetableUrl = (language: string) =>
  language === 'en'
    ? 'https://www.1188.lv/en/transport/schedules/riga/dzimtmisa/200001/102628'
    : 'https://www.1188.lv/satiksme/saraksti/riga/dzimtmisa/200001/102628';
