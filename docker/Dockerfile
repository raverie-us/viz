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

#ENV CONDA_DIR /opt/conda
#RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /miniconda.sh && \
#    /bin/bash /miniconda.sh -b -p $CONDA_DIR && \
#    rm /miniconda.sh
#ENV PATH=$CONDA_DIR/bin:$PATH
#
#RUN git clone https://github.com/CompVis/stable-diffusion.git
#RUN cd stable-diffusion && \
#    conda env create -f environment.yaml && \
#    conda activate ldm

COPY simple.mp3 /simple.mp3
RUN allin1 /simple.mp3

#COPY song.mp3 /song.mp3

ENTRYPOINT [ "allin1", "--keep-byproducts", "--out-dir", "/tmp/viz", "/song.mp3"]
#CMD "nvidia-smi && python3"
#CMD python3
