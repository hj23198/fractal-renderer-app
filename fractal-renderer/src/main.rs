use image::{GenericImage, Rgba, Pixel};
use std::thread;
use std::sync::{Mutex, Arc};

fn main(){
    let args:Vec<String> = std::env::args().collect();
    let x:f64 = args[1].parse().unwrap();
    let y:f64 = args[2].parse().unwrap();
    let xsize:u32 = args[3].parse().unwrap();
    let ysize:u32 = args[4].parse().unwrap();
    let zoom:f64 = args[5].parse().unwrap();
    let numthreads:u8 = args[6].parse().unwrap();
    let depth:u32 = args[7].parse().unwrap();

    generate(x, y, xsize, ysize, zoom, numthreads, depth);

}

fn generate(x:f64, y:f64, xsize:u32, ysize:u32, zoom:f64, numthreads:u8, depth:u32){

    let searched: Arc<Mutex<Vec<Vec<bool>>>> = Arc::new(Mutex::new(vec![vec![false; xsize as usize]; ysize as usize]));
    let repetition_values: Arc<Mutex<Vec<Vec<u32>>>> = Arc::new(Mutex::new(vec![vec![0; xsize as usize]; ysize as usize]));

    let change: f64 = zoom / ysize as f64;
    let x_corner: f64 = x - (change * xsize as f64 / 2.0);
    let y_corner: f64 = y - (change * ysize as f64/ 2.0);

    let next_to_value: [i64; 3] = [-1, 0, 1];

    let mut temporary_stack: Vec<[u32; 2]> = vec![[0, 0]];

    for i in 0..xsize {
        temporary_stack.push([i, 0]);
        temporary_stack.push([i, xsize-1])
    }

    for i in 1..ysize-1 {
        temporary_stack.push([0, i]);
        temporary_stack.push([xsize-1, i])
    }

    let stack: Arc<Mutex<Vec<[u32; 2]>>> = Arc::new(Mutex::new(temporary_stack));

    let mut threads = vec![];

    for _ in 0..numthreads {
        let searched = Arc::clone(&searched);
        let repetition_values = Arc::clone(&repetition_values);
        let stack = Arc::clone(&stack);

        threads.push(thread::spawn(move || {
            loop {
                let mut stack_pointer = stack.lock().unwrap();
                if stack_pointer.len() == 1 {
                    drop(stack_pointer);
                    break;
                }

                let coords: [u32; 2] = stack_pointer.pop().unwrap();
                drop(stack_pointer);
                
                let image_x: i64 = coords[0] as i64;
                let image_y: i64 = coords[1] as i64;


                let searched_areas = searched.lock().unwrap();
                if searched_areas[image_x as usize][image_y as usize] {
                    drop(searched_areas);
                    continue;
                }
                drop(searched_areas);

                let r_value: f64 = x_corner + (image_x as f64 * change);
                let i_value: f64 = y_corner + (image_y as f64 * change);

                let repetition_value: u32 = test_pixel(r_value, i_value, depth);

                let mut repetition_pointer = repetition_values.lock().unwrap();
                repetition_pointer[image_x as usize][image_y as usize] = repetition_value;
                drop(repetition_pointer);

                let mut searched_areas = searched.lock().unwrap();
                searched_areas[image_x as usize][image_y as usize] = true;
                
                if repetition_value == 0 {
                    drop(searched_areas);
                    continue;
                }

                let mut stack_pointer = stack.lock().unwrap();

                for xmod in next_to_value.iter() {
                    for ymod in next_to_value.iter() {
    
    
                        if 0 <= image_x + xmod && image_x + xmod < xsize as i64 && 0 <= image_y + ymod && image_y+ymod < ysize as i64 {
                            if searched_areas[(image_x+*xmod) as usize][(image_y+ymod) as usize] == false {
                                stack_pointer.push([(image_x + *xmod) as u32, (image_y+ *ymod) as u32])
                            }
                        }
                    }
                }
                drop(searched_areas);
                drop(stack_pointer);
            }
        }));
    }

    for thread in threads {
        thread.join();
    }



    let exe_path = std::env::current_exe().unwrap().parent().unwrap().join("grad.tiff");
    let sample_image = image::open(exe_path).unwrap().to_rgb8();
    let mut image = image::DynamicImage::new_rgb8(xsize as u32, ysize as u32);
    let repetition_values_pointer = repetition_values.lock().unwrap();

    for x_iter in 0..xsize {
        for y_iter in 0..ysize {
            let value = repetition_values_pointer[x_iter as usize][y_iter as usize];
            if value == 0 {
                image.put_pixel(x_iter as u32, y_iter as u32, Rgba([0, 0, 0, 0]))
            } else {
                image.put_pixel(x_iter as u32, y_iter as u32, sample_image.get_pixel(value as u32 % 299, 0).to_rgba())
            }

        }
    }

    let exe_path = std::env::current_exe().unwrap().parent().unwrap().join("fractal_image.png");
    image.save(exe_path);

}

//struct for working with complex numbers
//can add another inum to self, and square itself
//TODO: add general multiplication for other sets


struct inum{r:f64, i:f64}

impl inum{
    fn add (&mut self, num:inum){
        self.r = self.r + num.r;
        self.i = self.i + num.i;
    }

    fn square (&mut self){

        let r:f64 = self.r*self.r - self.i*self.i;
        let i:f64 = self.r * self.i * 2.0;

        self.r = r;
        self.i = i;

    }
}

//Tests mandelbrot set coord 
fn test_pixel(x:f64, y:f64, rep:u32) -> u32 {
    let mut i:inum = inum { r:0.0, i: 0.0  };

    for item in 1..rep{
        i.square();
        i.add(inum { r: x, i: y });

        if i.r > 2.0 || i.i > 2.0 {
            return item
        }
    }
    return 0
}


