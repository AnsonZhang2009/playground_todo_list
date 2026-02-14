import {CalendarDate, getLocalTimeZone, today} from "@internationalized/date";

export function convertJSDate(jsDate: Date): CalendarDate {
	const year = jsDate.getUTCFullYear()
	const month = jsDate.getUTCMonth() + 1
	const day = jsDate.getUTCDate()
	return new CalendarDate(year, month, day)
}


export function getTodayDate(): CalendarDate {
	return today(getLocalTimeZone())
}
