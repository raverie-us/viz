FROM nvidia/cuda:11.8.0-devel-ubuntu22.04 as production

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
        ffmpeg \
        git \
        libglib2.0-0 \
        python3-dev \
        python3-opencv \
        python3-pip \
        wget

RUN python3 -m pip install --upgrade pip

RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

RUN pip3 install natten==0.15.1+torch210cu118 -f https://shi-labs.com/natten/wheels

RUN pip install git+https://github.com/CPJKU/madmom  # install the latest madmom directly from GitHub
RUN pip install allin1  # install this package

RUN git clone https://github.com/Stability-AI/stablediffusion.git

RUN pip install transformers==4.19.2 diffusers invisible-watermark
RUN cd stablediffusion && pip install -r requirements.txt

RUN pip3 install -U xformers --index-url https://download.pytorch.org/whl/cu118

# Install a specific version of nodejs / npm
RUN wget -q -O- https://deb.nodesource.com/setup_21.x | bash
RUN apt-get update && apt-get install -y nodejs && \
    npm i -g npm

COPY v1-5-pruned-emaonly.ckpt /v1-5-pruned-emaonly.ckpt
COPY v1-inference.yaml /v1-inference.yaml

RUN groupadd -g 1000 group && useradd -g 1000 -u 1000 -ms /bin/bash user
USER user
WORKDIR /home/user

# Warm up song feature extraction
COPY simple.mp3 /simple.mp3
RUN allin1 /simple.mp3

# Warm up stable diffusion
RUN python3 stablediffusion/scripts/txt2img.py --prompt "test" --ckpt /v1-5-pruned-emaonly.ckpt --config /v1-inference.yaml --H 1 --W 1 --device cuda || \
    true


#CMD python3 stablediffusion/scripts/txt2img.py --outdir /tmp/viz --prompt "a professional photograph of an astronaut riding a horse" --ckpt /v1-5-pruned-emaonly.ckpt --config /v1-inference.yaml --n_samples 1 --H 512 --W 512 --device cuda

#COPY song.mp3 /song.mp3
#CMD allin1 --keep-byproducts --out-dir /tmp/viz /song.mp3

#ENTRYPOINT [ "allin1", "--keep-byproducts", "--out-dir", "/tmp/viz", "/song.mp3"]
#CMD "nvidia-smi && python3"
#CMD python3
