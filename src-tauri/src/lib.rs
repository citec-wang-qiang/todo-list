use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
  std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
  std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
  let db_dir = app
    .path()
    .app_data_dir()
    .map_err(|e| e.to_string())?;
  Ok(db_dir.join("todo.db").to_string_lossy().to_string())
}

#[tauri::command]
fn copy_file(src: String, dest: String) -> Result<(), String> {
  std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![Migration {
    version: 1,
    description: "create initial tables",
    sql: include_str!("../migrations/001_init.sql"),
    kind: MigrationKind::Up,
  }];

  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:todo.db", migrations)
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      write_file,
      read_file,
      get_db_path,
      copy_file
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
