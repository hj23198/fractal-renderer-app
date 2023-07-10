use std::time::Instant;
use serde_json::Value;

mod imaginary_tools;
mod color;


fn main(){
    let config_path = std::env::current_exe().unwrap().parent().unwrap().join("request.json");
    let json_str = std::fs::read_to_string(config_path).unwrap();
    let json: Value = serde_json::from_str(&json_str).unwrap();
    
    let repetition_values: Vec<Vec<u32>> = imaginary_tools::render(json["x"].as_f64().unwrap(), json["y"].as_f64().unwrap(), json["xsize"].as_u64().unwrap() as u32, json["ysize"].as_u64().unwrap() as u32, json["zoom"].as_f64().unwrap(), json["numthreads"].as_u64().unwrap() as u8, json["depth"].as_u64().unwrap() as u32);

    let time_to_color = Instant::now();
    let elapsed = time_to_color.elapsed();
    println!("Color time: {}", elapsed.as_millis());

    let to_save = color::color_depth_values(repetition_values, json);
    let exe_path = std::env::current_exe().unwrap().parent().unwrap().join("fractal_image.png");
    to_save.save(exe_path);

}


