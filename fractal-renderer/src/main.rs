
use image::{Rgb, GenericImage, Rgba, Pixel};
use std::iter::Sum;
use std::{io, thread};
use std::sync::mpsc::{self, Sender};

fn main(){
    let args:Vec<String> = std::env::args().collect();
    let x:f64 = args[1].parse().unwrap();
    let y:f64 = args[2].parse().unwrap();
    let xsize:u32 = args[3].parse().unwrap();
    let ysize:u32 = args[4].parse().unwrap();
    let zoom:f64 = args[5].parse().unwrap();
    let numthreads:u8 = args[6].parse().unwrap();
    let rep_num:u32 = args[7].parse().unwrap();

    generate(x, y, xsize, ysize, zoom, numthreads, rep_num);

}

    fn assignAmountOfColumns(xsize:u32, numthreads:u8) -> Vec<u32> {
        //returns a vector of the amount of columns each thread should handle
        let mut output:Vec<u32> = vec![];

        if numthreads == 0 {
            panic!("No threads being used");
        }

        //add an equal starting amount of columns to each thread
        let starting_amount:u32 = (xsize - (xsize % numthreads as u32)) / numthreads as u32;

        for _ in 0..numthreads{
            output.push(starting_amount);
        }

        //then equally divide out the remainder
        let remainder:u32 = xsize % numthreads as u32;

        for i in 0..remainder {
            output[i as usize] += 1;
        }

        return output;
    }
        




    fn generate(x:f64, y:f64, xsize:u32, ysize:u32, zoom:f64, numthreads:u8, rep_num:u32){

        let exe_path = std::env::current_exe().unwrap().parent().unwrap().join("grad.tiff");
        let sample_image = image::open(exe_path).unwrap().to_rgb8();
        let mut image = image::DynamicImage::new_rgb8(xsize, ysize);
        let mut threads = vec![];
        let mut channels:Vec<mpsc::Receiver<(u32, u32, u32)>> = vec![];
        let x_change:f64 = zoom/xsize as f64;
        let y_change:f64 = zoom/ysize as f64;
        
        //set up the amount of columns we should assign to each individual thread
        let columns_per_thread:Vec<u32> = assignAmountOfColumns(xsize, numthreads);

        let mut image_pointer_x:Vec<Vec<u32>> = vec![];
        //image_pointer_y is just equal to 0 for all threads 
        let mut image_pointer_x_counter = 0;

        //starting point on fractal for threads 
        let mut fractal_pointer_x:Vec<Vec<f64>> = vec![];
        let mut fractal_pointer_y:Vec<Vec<f64>> = vec![];

        let mut fractal_pointer_x_counter:f64 = x - (x_change * xsize as f64/2.0);
        let fractal_pointer_y_counter:f64 = y - (y_change * ysize as f64/2.0);
        //assign parameter vectors to threads 
        for i in 0..numthreads {
            let mut image_pointer_to_push:Vec<u32> = vec![];
            let mut fractal_pointer_x_to_push:Vec<f64> = vec![];
            let mut fractal_pointer_y_to_push:Vec<f64> = vec![];

            for _i2 in 0..columns_per_thread[i as usize]{

                image_pointer_to_push.push(image_pointer_x_counter);
                fractal_pointer_x_to_push.push(fractal_pointer_x_counter);
                fractal_pointer_y_to_push.push(fractal_pointer_y_counter);
                image_pointer_x_counter += 1;
                fractal_pointer_x_counter += x_change;
            }
            fractal_pointer_x.push(fractal_pointer_x_to_push);
            fractal_pointer_y.push(fractal_pointer_y_to_push);
            image_pointer_x.push(image_pointer_to_push);
        }
        
        for i in 0..numthreads{
            let (tx, rx) = mpsc::channel();
            let fractal_pointer_x = fractal_pointer_x[i as usize].clone();
            let fractal_pointer_y = fractal_pointer_y[i as usize].clone();
            let image_pointer_x = image_pointer_x[i as usize].clone();

            channels.push(rx);
            threads.push(thread::spawn(move || {
                thread_target(&fractal_pointer_x, &fractal_pointer_y, &image_pointer_x, &ysize, &y_change, &tx, rep_num);
            }))
        }


    
        loop{

            if channels.len() == 0{
                break;
            }
            for i in 0..channels.len(){
                let (x, y, p) = channels[i as usize].recv().unwrap();

                if x == 0 && y == 0 && p == 0 {
                    //handle thread exit 
                    threads.remove(i as usize);
                    channels.remove(i as usize);
                    break;
                }
                if p == 299{

                    image.put_pixel(x, y, Rgba([0, 0, 0, 0]));
                } else {
                image.put_pixel(x, y, sample_image.get_pixel(p as u32, 0).to_rgba());
                }
                    
        

            }
        }

    

    let exe_path = std::env::current_exe().unwrap().parent().unwrap().join("fractal_image.png");
    //image = image.resize(1000, 1000, CatmullRom);
    image.save(exe_path);

}

 

fn thread_target(xpoint:&Vec<f64>, ypoint:&Vec<f64>, imagexpoint:&Vec<u32>, repetitions:&u32, ychange:&f64, tx:&Sender<(u32, u32, u32)>, rep_num:u32) {

    for i in 0..xpoint.len(){

        let mut y:f64 = ypoint[i as usize];
        let x:f64 = xpoint[i as usize];
        let imx:u32 = imagexpoint[i as usize];

        for r in 0..*repetitions{

            let mut pix:u32 = test_pixel(x, y, rep_num);
            if pix == 0{
                pix = 1;
            }

            tx.send((imx as u32, r as u32, pix as u32));
            
            y += ychange;
        }
    }
    //this signals to the main thread that all the data has been sent 
    tx.send((0, 0, 0));
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

        if (i.r*i.r)+(i.i*i.i) > 2.0 {
            return (item / 2)% 299;
        }
    }
    return 299;
}


