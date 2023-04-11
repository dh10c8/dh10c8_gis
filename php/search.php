<?php
include('../php/connect.php');
if (isset($_GET['ten_vung'])) {
    $ten_vung = $_GET['ten_vung'];
    $name = strtolower($ten_vung);

    $query = "SELECT *,st_x(ST_Centroid(geom)) AS x,st_y(ST_Centroid(geom)) AS y 
                FROM public.camhoangdc_1 WHERE LOWER(txtmemo) LIKE '%$name%'";
    $result = pg_query($con, $query);
    $tong_kq = pg_num_rows($result);

    if ($tong_kq > 0) {
        while ($row = pg_fetch_row($result, NULL, PGSQL_ASSOC)) {
            // var_dump($row);
            $name = $row['chusd'];
            $txtmemo = $row['txtmemo'];
            $x = $row['x'];
            $y = $row['y'];
            echo "<li class='data-item'>$txtmemo : $name <input type='hidden' class='x' value='$x'> <input type='hidden' class='y' value='$y'> </li>
            <br>";
        }
    } else {
        echo "<li>Tên vùng không tồn tại.</li>";
    }
}

?>