
"use client";

import { Element } from "react-scroll";
import FavoriteCardWrapper from "./FavoriteCardWrapper";
import FavoriteCardImage from "./FavoriteCardImage";
import FavoriteCardInfo from "./FavoriteCardInfo";

export default function ProductFavorite({
  product,
  onClick,
  isHighlighted,
  fromCenter,
}) {
  return (
    <Element name={`favorite-${product.id}`}>
      <FavoriteCardWrapper
        productId={product.id}
        onClick={onClick}
        isHighlighted={isHighlighted}
      >
        <FavoriteCardImage
          product={product}
          fromCenter={fromCenter}
        />
        <FavoriteCardInfo product={product} />
      </FavoriteCardWrapper>
    </Element>
  );
}


