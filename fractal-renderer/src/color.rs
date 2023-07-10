use image::{RgbImage, Rgb};
use serde_json::Value;


/// Generates colored image based on depth values and request json 
/// 
/// apply_log_grad
/// 
/// "color_method": "log_grad",
/// "color_params": {
///         "point1":[u8; 3],
///         "point2":[u8; 3],
///         "set_color":[u8; 3],"
///         "repetitions":u32"
///         "base":f64"
///     }
///
pub fn color_depth_values(depth_values: Vec<Vec<u32>>, request: Value) -> RgbImage {
    let request_type = request["color_method"].as_str().unwrap();

    if request_type == "log_grad" {
        let params = request["color_params"].clone();
        let xsize = request["xsize"].as_u64().unwrap() as u32;
        let ysize = request["ysize"].as_u64().unwrap() as u32;
        let point1 = params["point1"].as_array().unwrap().iter().map(|x| x.as_i64().unwrap() as i16).collect::<Vec<i16>>();
        let point2 = params["point2"].as_array().unwrap().iter().map(|x| x.as_i64().unwrap() as i16).collect::<Vec<i16>>();
        let set_color_vec = params["set_color"].as_array().unwrap().iter().map(|x| x.as_u64().unwrap() as u8).collect::<Vec<u8>>();
        let set_color = Rgb([set_color_vec[0], set_color_vec[1], set_color_vec[2]]);
        let base = params["base"].as_f64().unwrap();
        let repetitions = params["repetitions"].as_u64().unwrap() as u32;

        let colored_image = apply_log_grad(depth_values, xsize, ysize, point1, point2, set_color, base, repetitions);
        return colored_image;

    }


    return RgbImage::new(1, 1);
}


/// Colors set of depth values using a logarithmic gradient. The gradient colors range from point_1 to point_2, filling points part of the Mandelbrot set
/// with the color set_color. The gradient is seen in the resulting image repetition times. 
fn apply_log_grad(depth_values: Vec<Vec<u32>>, xsize: u32, ysize: u32, point_1: Vec<i16>, point_2: Vec<i16>, set_color: Rgb<u8>, base: f64, repetitions: u32) -> RgbImage {
    let point_delta = [point_2[0] - point_1[0], point_2[1] - point_1[1], point_2[2] - point_1[2]];
    let mut minmax: [u32; 2]  = get_min_max(&depth_values, xsize, ysize);
    if minmax[0] == 0 {
        minmax[0] = 1;
    }

    let repetition_difference = ((minmax[1] as f64).log(base) - (minmax[0] as f64).log(base)) / repetitions as f64;
    let mod_value = (minmax[1] - minmax[0]) / repetitions;
    let color_delta: [f64; 3] = point_delta.map(|x| x as f64 / repetition_difference as f64);

    let mut image = RgbImage::new(xsize, ysize);

    for x_iter in 0..xsize {
        for y_iter in 0..ysize {
            let value = depth_values[x_iter as usize][y_iter as usize];

            if value == 0 {
                image.put_pixel(x_iter, y_iter, set_color);
            } else {
                image.put_pixel(x_iter, y_iter, Rgb([
                    (point_1[0] + ((value as f64).log(base) * color_delta[0]) as i16 % mod_value as i16) as u8,
                    (point_1[1] + ((value as f64).log(base) * color_delta[1]) as i16 % mod_value as i16) as u8,
                    (point_1[2] + ((value as f64).log(base) * color_delta[2]) as i16 % mod_value as i16) as u8
                ]));
            }
        }
    }
    return image;
}


//apply_hist_grad






/// Returns the min and max value in a  xsize by ysize matrix
fn get_min_max(matrix: &Vec<Vec<u32>>, xsize: u32, ysize: u32) -> [u32; 2] {
    let mut current_min = 0;
    let mut current_max = 0;

    for i in 0..xsize {
        for k in 0..ysize {
            let value = matrix[i as usize][k as usize];
            current_min = std::cmp::min(current_min, value);
            current_max = std::cmp::max(current_max, value);
        }
    }

    return [current_min, current_max];
}






