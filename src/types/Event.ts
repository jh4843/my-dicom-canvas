import type MyImage from "@/components/Image/MyImage";

export enum eEventType {
  event_type_invalid,
  // load
  event_type_load = 10,
  event_type_loadstart,
  event_type_loaditem,
  event_type_loadend,
  // render
  event_type_render_start = 20,
  event_type_render_end,
  // draw
  event_type_draw_create = 30,
  event_type_draw_delete,
  event_type_draw_move,
  // manipulate
  event_type_position_change = 40,
  event_type_undo,
  event_type_redo,
  // etc
  event_type_append_frame = 50,
  //
  event_type_abort = 100,
}

export enum eEventLoadType {
  event_load_type_invalid = 0,
  event_load_type_error,
  event_load_type_file_io = 10,
  event_load_type_url_io,
  event_load_type_state = 20,
  event_load_type_image = 30,
}

export interface IEventData {
  image?: MyImage;
}

export interface IEventInfo {
  id?: number;
  type?: eEventType;
  loadType?: eEventLoadType;
  src?: object; // Source object (ex. File object)
  data?: IEventData;
  error?: unknown;
}
