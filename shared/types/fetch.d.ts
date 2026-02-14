/**
 * Options for retrieving tasks with filtering capabilities.
 * All properties are optional; omitting a property disables its filter.
 * Filters are combined with logical AND when multiple are provided.
 */
export interface GetTasksOptions {
	title?: string,
	dateRangeStart?: Date,
	dateRangeEnd?: Date,
	completed?: boolean,
	exactTitle?: boolean,
	id?: number,
}
